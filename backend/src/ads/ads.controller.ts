import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { AdsService } from './ads.service';

@Controller('ads')
export class AdsController {
    constructor(private readonly adsService: AdsService) { }

    @UseInterceptors(CacheInterceptor)
    @Get('highlighted')
    async getHighlightedAds(@Query('authorRole') authorRole?: string) {
        return this.adsService.getHighlightedAds(authorRole);
    }
}
