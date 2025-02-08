import { type Connection, type InsertConnection } from "@shared/schema";

export interface IStorage {
  getConnection(connectionId: string): Promise<Connection | undefined>;
  createConnection(connection: InsertConnection): Promise<Connection>;
  deleteConnection(connectionId: string): Promise<void>;
  getAllConnections(): Promise<Connection[]>;
}

export class MemStorage implements IStorage {
  private connections: Map<string, Connection>;
  private currentId: number;

  constructor() {
    this.connections = new Map();
    this.currentId = 1;
  }

  async getConnection(connectionId: string): Promise<Connection | undefined> {
    return Array.from(this.connections.values()).find(
      conn => conn.connectionId === connectionId
    );
  }

  async createConnection(connection: InsertConnection): Promise<Connection> {
    const id = this.currentId++;
    // Ensure isSharing has a default value if not provided
    const newConnection: Connection = {
      ...connection,
      id,
      isSharing: connection.isSharing ?? false
    };
    this.connections.set(connection.connectionId, newConnection);
    return newConnection;
  }

  async deleteConnection(connectionId: string): Promise<void> {
    this.connections.delete(connectionId);
  }

  async getAllConnections(): Promise<Connection[]> {
    return Array.from(this.connections.values());
  }
}

export const storage = new MemStorage();