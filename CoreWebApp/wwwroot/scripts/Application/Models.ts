module Models {
    export class AppMessage {
        Id: number;
        CreatedOn: Date;
        CreatedByUserId: string;
        TargetUserId: string;
        Subject: string;
        Content: string;
        FromName: string;
        ToName: string;
        ParentId: number;
        IsReadByTarget: number;
        TypeName: string;
    }
    export class BaseArticle {
        Id: string;
        Title: string;
        Content: string;
        ImageUrl: string;
        TypeName: string;
        Category: Category;
    }
    export class Article extends BaseArticle {
        Description: string;
        Created: Date;
        CategoryId: number;
        CreatedByUserId: number;
        Domain: string;
        Url: string;
        TypeName: string;
        Files: FileObject[];
    }
    export class Category {
        Id: string;
        Title: string;
        Code: string;
        ParentId: number;
        TypeName: string;
    }
}