
import { Volume } from './types';

export const INITIAL_VOLUMES: Volume[] = [
  {
    id: '1',
    title: 'Wuthering Heights',
    author: 'Emily Brontë',
    classifications: ['Classic', 'Gothic', '19th Century'],
    archivalId: 'V-1847',
    marks: [
      { id: 'b1', text: '“Terror made me cruel.”', page: 'Ch. 3', date: '2026-01-15' },
      { id: 'b2', text: '“I am Heathcliff.”', page: 'Ch. 9', date: '2026-01-20' }
    ]
  },
  {
    id: '2',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    classifications: ['Fiction', 'Jazz Age', 'Modernism'],
    archivalId: 'V-1925',
    marks: [
      { id: 'b3', text: '“So we beat on, boats against the current...”', page: 'Ch. 9', date: '2026-02-01' }
    ]
  }
];
