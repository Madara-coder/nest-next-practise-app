import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Log of processed inbound webhook events, used for deduplication and auditing. */
@Entity('webhook_events')
export class WebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  provider: string;

  @Column({ name: 'event_id', unique: true })
  eventId: string;

  @Column()
  type: string;

  @Column({ type: 'jsonb' })
  payload: object;

  @CreateDateColumn({ name: 'received_at', type: 'timestamptz' })
  receivedAt: Date;
}
