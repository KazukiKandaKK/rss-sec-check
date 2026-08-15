export class SearchQuery {
  readonly term: string;

  private constructor(term: string) {
    this.term = term;
  }

  static of(raw: string): SearchQuery {
    return new SearchQuery(raw.trim().toLowerCase());
  }

  get isEmpty(): boolean {
    return this.term === "";
  }

  isIncludedIn(...texts: string[]): boolean {
    if (this.isEmpty) return true;
    return texts.some((text) => text.toLowerCase().includes(this.term));
  }
}
