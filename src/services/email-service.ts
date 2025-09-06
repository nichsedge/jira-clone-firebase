
'use server'

import Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import type { EmailCredentials } from '@/lib/types';

export type { ParsedMail };

export async function fetchUnreadEmails(credentials: EmailCredentials): Promise<ParsedMail[]> {
    console.log('fetchUnreadEmails: Starting with credentials:', {
        host: credentials.host,
        port: credentials.port,
        user: credentials.user,
        hasPass: !!credentials.pass,
        tls: credentials.tls,
    });

    if (!credentials || !credentials.host || !credentials.port || !credentials.user || !credentials.pass) {
        const errorMessage = `Email fetching is not configured. Please provide all required IMAP credentials.`;
        console.error('fetchUnreadEmails: Invalid credentials -', errorMessage);
        throw new Error(errorMessage);
    }

    const imapConfig: Imap.Config = {
        user: credentials.user,
        password: credentials.pass,
        host: credentials.host,
        port: credentials.port,
        tls: credentials.tls,
        tlsOptions: {
            rejectUnauthorized: false
        }
    };

    return new Promise((resolve, reject) => {
        const imap = new Imap(imapConfig);
        const emails: ParsedMail[] = [];
        
        console.log('fetchUnreadEmails: Attempting IMAP connection to', credentials.host, 'port', credentials.port);
        
        imap.once('ready', () => {
            console.log('fetchUnreadEmails: IMAP connection successful, opening INBOX');
            imap.openBox('INBOX', false, (err, box) => { // false so we don't mark as read automatically
                if (err) {
                    console.error('fetchUnreadEmails: Error opening INBOX:', err);
                    imap.end();
                    return reject(err);
                }
                
                console.log('fetchUnreadEmails: INBOX opened, searching for UNSEEN emails');
                console.log('fetchUnreadEmails: INBOX info:', {
                    messages: box.messages.total,
                    new: box.messages.new
                });
                
                imap.search(['UNSEEN'], (err, results) => {
                    if (err) {
                        console.error('fetchUnreadEmails: Search error:', err);
                        imap.end();
                        return reject(err);
                    }

                    console.log(`fetchUnreadEmails: Found ${results.length} UNSEEN emails`);

                    if (results.length === 0) {
                        console.log('fetchUnreadEmails: No unread emails found');
                        imap.end();
                        return resolve([]);
                    }

                    console.log('fetchUnreadEmails: Fetching email bodies...');
                    const f = imap.fetch(results, { bodies: '' });
                    const messagePromises: Promise<ParsedMail>[] = [];

                    f.on('message', (msg, seqno) => {
                        console.log(`fetchUnreadEmails: Processing message ${seqno}`);
                        messagePromises.push(processMessage(msg));
                    });

                    f.once('error', (err) => {
                        console.error('fetchUnreadEmails: Fetch error:', err);
                        imap.end();
                        reject(err);
                    });

                    f.once('end', () => {
                        console.log(`fetchUnreadEmails: All ${results.length} messages fetched, parsing...`);
                        Promise.all(messagePromises).then(parsedEmails => {
                            console.log(`fetchUnreadEmails: Successfully parsed ${parsedEmails.length} emails`);
                            
                            // Mark emails as read after successful parsing
                            console.log('fetchUnreadEmails: Marking emails as read...');
                            imap.addFlags(results, ['\\Seen'], (err) => {
                                if (err) {
                                    console.error('fetchUnreadEmails: Error marking emails as read:', err);
                                    // Still resolve with emails, but log the error
                                } else {
                                    console.log('fetchUnreadEmails: Successfully marked emails as read');
                                }
                                imap.end();
                                resolve(parsedEmails);
                            });
                        }).catch(err => {
                             console.error('fetchUnreadEmails: Error parsing emails:', err);
                             imap.end();
                             reject(err);
                        })
                    });
                });
            });
        });

        imap.once('error', (err: Error) => {
            console.error('fetchUnreadEmails: IMAP connection error:', err);
            if (err.message.includes('AUTH')) {
                console.error('fetchUnreadEmails: Authentication failed - check username/password and Gmail app password settings');
            } else if (err.message.includes('ECONNREFUSED') || err.message.includes('connect')) {
                console.error('fetchUnreadEmails: Connection refused - check IMAP host/port and network connectivity');
            }
            reject(err);
        });

        imap.once('end', () => {
           console.log('fetchUnreadEmails: IMAP connection closed');
        });

        console.log('fetchUnreadEmails: Connecting to IMAP server...');
        imap.connect();
    });
}

const processMessage = (msg: Imap.ImapMessage): Promise<ParsedMail> => {
    return new Promise((resolveMessage, rejectMessage) => {
        let buffer = '';
        msg.on('body', (stream) => {
            stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
            });
        });
        msg.once('end', () => {
           simpleParser(buffer)
            .then((parsed) => {
                console.log(`processMessage: Successfully parsed email with subject: "${parsed.subject || 'No Subject'}" from "${parsed.from?.text || 'Unknown'}"`);
                resolveMessage(parsed);
            })
            .catch((err) => {
                console.error('processMessage: Failed to parse email:', err);
                rejectMessage(err);
            });
        });
    });
};
