import { NextResponse } from 'next/server';

export async function GET() {
  const statuses = [
    { id: 'OPEN', name: 'Open', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
    { id: 'IN_PROGRESS', name: 'In Progress', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
    { id: 'DONE', name: 'Done', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
    { id: 'CLOSED', name: 'Closed', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' }
  ];

  return NextResponse.json(statuses);
}