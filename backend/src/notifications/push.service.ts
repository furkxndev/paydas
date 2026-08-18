import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

import { AppConfig } from '../config/configuration';

export interface PushPayload {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  channelId?: string;
}

/**
 * Expo push servisine gönderim yapan ince katman.
 * Gönderim başarısız olursa uygulama akışı bozulmaz; yalnızca loglanır.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly expo: Expo;

  constructor(config: ConfigService) {
    this.expo = new Expo({
      accessToken: config.get<AppConfig['expoAccessToken']>('expoAccessToken'),
    });
  }

  async send({
    tokens,
    title,
    body,
    data,
    channelId,
  }: PushPayload): Promise<number> {
    const valid = tokens.filter((token) => Expo.isExpoPushToken(token));
    if (valid.length === 0) return 0;

    const messages: ExpoPushMessage[] = valid.map((to) => ({
      to,
      sound: 'default',
      title,
      body,
      data,
      channelId,
      priority: 'high',
    }));

    let delivered = 0;
    for (const chunk of this.expo.chunkPushNotifications(messages)) {
      try {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);
        delivered += tickets.filter((ticket) => ticket.status === 'ok').length;
      } catch (error) {
        this.logger.warn(
          `Push bildirimi gönderilemedi: ${error instanceof Error ? error.message : 'bilinmeyen hata'}`,
        );
      }
    }
    return delivered;
  }
}
