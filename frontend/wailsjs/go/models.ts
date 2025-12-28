export namespace main {
	
	export class Credential {
	    id: string;
	    serviceName: string;
	    url: string;
	    username: string;
	    password: string;
	    category: string;
	    iconURL: string;
	    // Go type: time
	    createdAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Credential(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.serviceName = source["serviceName"];
	        this.url = source["url"];
	        this.username = source["username"];
	        this.password = source["password"];
	        this.category = source["category"];
	        this.iconURL = source["iconURL"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ImportResult {
	    totalProcessed: number;
	    imported: number;
	    skipped: number;
	    errors: string[];
	
	    static createFrom(source: any = {}) {
	        return new ImportResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.totalProcessed = source["totalProcessed"];
	        this.imported = source["imported"];
	        this.skipped = source["skipped"];
	        this.errors = source["errors"];
	    }
	}
	export class PasswordGeneratorOptions {
	    length: number;
	    includeUppercase: boolean;
	    includeLowercase: boolean;
	    includeNumbers: boolean;
	    includeSymbols: boolean;
	    excludeAmbiguous: boolean;
	
	    static createFrom(source: any = {}) {
	        return new PasswordGeneratorOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.length = source["length"];
	        this.includeUppercase = source["includeUppercase"];
	        this.includeLowercase = source["includeLowercase"];
	        this.includeNumbers = source["includeNumbers"];
	        this.includeSymbols = source["includeSymbols"];
	        this.excludeAmbiguous = source["excludeAmbiguous"];
	    }
	}

}

