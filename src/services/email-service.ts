
'use server'

import Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';

export type { ParsedMail };

const imapConfig: Imap.Config = {
    user: process.env.IMAP_USER!,
    password: process.env.IMAP_PASSWORD!,
    host: process.env.IMAP_HOST!,
    port: parseInt(process.env.IMAP_PORT || '993', 10),
    tls: true,
    tlsOptions: {
        rejectUnauthorized: false
    }
};

export async function fetchUnreadEmails(): Promise<ParsedMail[]> {
    return new Promise((resolve, reject) => {
        const imap = new Imap(imapConfig);
        const emails: ParsedMail[] = [];
        let completed = 0;
        let totalMessages = 0;

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
            imap.openBox('INBOX', true, (err, box) => {
                if (err) {
                    imap.end();
                    return reject(err);
                }
                
                imap.search(['UNSEEN'], (err, results) => {
                    if (err) {
                        imap.end();
                        return reject(err);
                    }

                    totalMessages = results.length;
                    if (totalMessages === 0) {
                        imap.end();
                        return resolve([]);
                    }

                    const f = imap.fetch(results, { bodies: '' });
                    
                    f.on('message', (msg, seqno) => {
                        processMessage(msg).then(parsedMail => {
                            emails.push(parsedMail);
                            completed++;
                            if (completed === totalMessages) {
                                imap.end();
                            }
                        }).catch(err => {
                            console.error('Error parsing email:', err);
                            completed++;
                             if (completed === totalMessages) {
                                imap.end();
                            }
                        });
                    });

                    f.once('error', (err) => {
                        console.error('Fetch error:', err);
                        reject(err);
                    });

                    f.once('end', () => {
                        // All messages have been fetched
                    });
                });
            });
        });

        imap.once('error', (err: Error) => {
            reject(err);
        });

        imap.once('end', () => {
           resolve(emails);
        });

        imap.connect();
    });
}
