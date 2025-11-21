/* eslint-disable prettier/prettier */
export class CreateDraftDto {
    key: string;
    data: any;
    userId?: string;
    title?: string;
}

export class UpdateDraftDto {
    data?: any;
    title?: string;
}
