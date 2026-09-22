export interface SqlClient {
  query(sql: string): Promise<unknown>;
}
