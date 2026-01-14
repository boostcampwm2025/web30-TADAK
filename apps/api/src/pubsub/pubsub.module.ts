import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Submission } from '../submission/submission.entity';
import { PubsubGateway } from './pubsub.gateway';
import { PubsubSubscriberService } from './pubsub-subscriber.service';

@Module({
  imports: [TypeOrmModule.forFeature([Submission])],
  providers: [PubsubSubscriberService, PubsubGateway],
  exports: [PubsubSubscriberService, PubsubGateway],
})
export class PubsubModule {}
