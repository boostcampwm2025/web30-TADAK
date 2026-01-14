import { Module } from '@nestjs/common';

import { PubsubSubscriberService } from './pubsub-subscriber.service';

@Module({
  providers: [PubsubSubscriberService],
  exports: [PubsubSubscriberService],
})
export class PubsubModule {}
