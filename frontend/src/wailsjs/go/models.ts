// Wails Models Stub
// This file will be replaced by auto-generated models during wails dev/build

export namespace main {
  export class Credential {
    id: string;
    serviceName: string;
    url: string;
    username: string;
    password: string;
    category: string;
    iconURL: string;
    createdAt: string;

    constructor(data: any) {
      this.id = data.id || '';
      this.serviceName = data.serviceName || '';
      this.url = data.url || '';
      this.username = data.username || '';
      this.password = data.password || '';
      this.category = data.category || '';
      this.iconURL = data.iconURL || '';
      this.createdAt = data.createdAt || '';
    }
  }
}
