import { Module } from '@nestjs/common';

import { PubsubService } from './pubsub.service';

@Module({
  providers: [PubsubService],
  exports: [PubsubService],
})
export class PubSubModule {}
