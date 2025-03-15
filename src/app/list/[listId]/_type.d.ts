export namespace ListPageType {
  export namespace Response {
    export interface Success {
      id: string;
      name: string;
    }
    export interface Error {
      message: string;
    }
  }
}