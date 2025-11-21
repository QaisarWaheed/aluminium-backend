/* eslint-disable prettier/prettier */
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DraftService } from '../../services/draft.service';
import { CreateDraftDto, UpdateDraftDto } from '../../draft.dto';

@ApiTags('Drafts')
@Controller('drafts')
export class DraftController {
    constructor(private readonly draftService: DraftService) { }

    @Get()
    async findAll() {
        return await this.draftService.findAll();
    }

    @Get('/:id')
    async findById(@Param('id') id: string) {
        return await this.draftService.findById(id);
    }

    @Get('/key/:key')
    async findByKey(@Param('key') key: string) {
        return await this.draftService.findByKey(key);
    }

    @Post()
    async createDraft(@Body() data: CreateDraftDto) {
        return await this.draftService.createDraft(data);
    }

    @Put('/:id')
    async updateDraft(@Param('id') id: string, @Body() data: UpdateDraftDto) {
        return await this.draftService.updateDraft(id, data);
    }

    @Delete('/:id')
    async deleteDraft(@Param('id') id: string) {
        return await this.draftService.deleteDraft(id);
    }
}
