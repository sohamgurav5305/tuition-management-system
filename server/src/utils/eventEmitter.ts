import { Response } from 'express';

export interface SSEClient {
  id: string;
  res: Response;
  userId?: string;
  role?: string;
}

class RealtimeEventHub {
  private clients: Map<string, SSEClient> = new Map();

  constructor() {
    // Send keep-alive heartbeat comments every 20 seconds
    setInterval(() => {
      this.broadcastComment('heartbeat');
    }, 20000);
  }

  public registerClient(client: SSEClient): () => void {
    this.clients.set(client.id, client);

    // Initial connection acknowledgment
    this.sendToClient(client, 'connected', {
      clientId: client.id,
      timestamp: new Date().toISOString(),
    });

    return () => {
      this.clients.delete(client.id);
    };
  }

  public broadcast(eventName: string, data: any = {}): void {
    const message = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients.values()) {
      try {
        client.res.write(message);
      } catch (err) {
        this.clients.delete(client.id);
      }
    }
  }

  public sendToUser(userId: string, eventName: string, data: any = {}): void {
    const message = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients.values()) {
      if (client.userId === userId) {
        try {
          client.res.write(message);
        } catch {
          this.clients.delete(client.id);
        }
      }
    }
  }

  public sendToRole(role: string, eventName: string, data: any = {}): void {
    const message = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients.values()) {
      if (client.role === role || client.role === 'ADMINISTRATOR') {
        try {
          client.res.write(message);
        } catch {
          this.clients.delete(client.id);
        }
      }
    }
  }

  private sendToClient(client: SSEClient, eventName: string, data: any): void {
    try {
      client.res.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {
      this.clients.delete(client.id);
    }
  }

  private broadcastComment(comment: string): void {
    for (const client of this.clients.values()) {
      try {
        client.res.write(`: ${comment}\n\n`);
      } catch {
        this.clients.delete(client.id);
      }
    }
  }

  public getConnectedCount(): number {
    return this.clients.size;
  }
}

export const realtimeHub = new RealtimeEventHub();
