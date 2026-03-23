import { Controller, Get, Query } from '@nestjs/common';
import { AdsService } from './ads.service';

@Controller('ads')
export class AdsController {
    constructor(private readonly adsService: AdsService) { }

    @Get('highlighted')
    async getHighlightedAds(@Query('authorRole') authorRole?: string) {
        return this.adsService.getHighlightedAds(authorRole);
    }
}
