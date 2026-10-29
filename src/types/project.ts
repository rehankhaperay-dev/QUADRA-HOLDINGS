/** A portfolio entry. Leave image undefined until a real practice project exists. */
export interface Project {
  id: string;
  title: string;
  summary: string;
  goal: string;
  builtWith: string;
  image?: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
  };
}
