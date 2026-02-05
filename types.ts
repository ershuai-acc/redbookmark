
export interface Mark {
  id: string;
  text: string;
  page?: string;
  date: string;
}

export interface Volume {
  id: string;
  title: string;
  author: string;
  classifications: string[];
  marks: Mark[]; // Renamed from snippets
  archivalId: string;
}

export interface AppState {
  volumes: Volume[];
}
