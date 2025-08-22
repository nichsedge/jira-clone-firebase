
'use server'

import Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import type { EmailCredentials } from '@/lib/types';

export type { ParsedMail };

export async function fetchUnreadEmails(credentials: EmailCredentials): Promise<ParsedMail[]> {
    if (!credentials || !credentials.host || !credentials.port || !credentials.user || !credentials.pass) {
        const errorMessage = `Email fetching is not configured. Please provide all required IMAP credentials.`;
        console.error(errorMessage);
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
                    .then(resolveMessage)
                    .catch(rejectMessage);
                });
            });
        };

        imap.once('ready', () => {
            imap.openBox('INBOX', false, (err, box) => { // false so we don't mark as read automatically
                if (err) {
                    imap.end();
                    return reject(err);
                }
                
                imap.search(['UNSEEN'], (err, results) => {
                    if (err) {
                        imap.end();
                        return reject(err);
                    }

                    if (results.length === 0) {
                        imap.end();
                        return resolve([]);
                    }

                    const f = imap.fetch(results, { bodies: '' });
                    const messagePromises: Promise<ParsedMail>[] = [];

                    f.on('message', (msg, seqno) => {
                        messagePromises.push(processMessage(msg));
                    });

                    f.once('error', (err) => {
                        console.error('Fetch error:', err);
                        imap.end();
                        reject(err);
                    });

                    f.once('end', () => {
                        Promise.all(messagePromises).then(parsedEmails => {
                            // Mark emails as read after successful parsing
                            imap.addFlags(results, ['\\Seen'], (err) => {
                                if (err) {
                                    console.error('Error marking emails as read:', err);
                                    // Still resolve with emails, but log the error
                                }
                                imap.end();
                                resolve(parsedEmails);
                            });
                        }).catch(err => {
                             imap.end();
                             reject(err);
                        })
                    });
                });
            });
        });

        imap.once('error', (err: Error) => {
            reject(err);
        });

        imap.once('end', () => {
           // Connection ended
        });

        imap.connect();
    });
}
