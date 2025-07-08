export interface Season {
  show: string;
  season: number;
  year: number;
  contestants: Contestant[];
}

export interface Contestant {
  name: string;
  profileImageUrl: string;
  profileLink: string;
}

export interface Queen {
  id: string;
  profileLink: string;
  profileImageUrl: string;
  name: string;
  looks: Look[];
}

export interface Look {
  caption: string;
  imageUrl: string;
  season: Pick<Season, "show" | "season">;
}
