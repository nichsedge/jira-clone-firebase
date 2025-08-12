
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

                    if (results.length === 0) {
                        imap.end();
                        return resolve([]);
                    }

                    const f = imap.fetch(results, { bodies: '' });
                    
                    f.on('message', (msg, seqno) => {
                        const parserPromise = new Promise<ParsedMail>((resolveMessage, rejectMessage) => {
                            const parser = simpleParser(source => {
                                // simpleParser will resolve the promise with the parsed mail object
                            });
    
                            parser.on('end', (mail) => {
                                resolveMessage(mail);
                            });
    
                            parser.on('error', (err) => {
                                rejectMessage(err);
                            });
    
                            msg.on('body', (stream, info) => {
                                stream.pipe(parser);
                            });
                        });
                        
                        parserPromise.then(parsedMail => {
                            emails.push(parsedMail);
                        }).catch(reject);
                    });

                    f.once('error', (err) => {
                        reject(err);
                    });

                    f.once('end', () => {
                        imap.end();
                        resolve(emails);
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
