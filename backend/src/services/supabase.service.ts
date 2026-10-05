import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverConfig } from "../configs/env.config.js";

export class SupabaseService {

  private readonly client: SupabaseClient;

  private readonly bucket = "documents";

  constructor() {

    this.client = createClient(
      serverConfig.SUPABASE_URL,
      serverConfig.SUPABASE_SECRET_KEY
    );
  }

  async uploadFile(
    path: string,
    buffer: Buffer,
    contentType: string
  ): Promise<void> {

    const { error } =
      await this.client.storage
        .from(this.bucket)
        .upload(
          path,
          buffer,
          {
            contentType,
            upsert: false,
          }
        );

    if (error) {
      throw new Error(
        `Failed to upload file: ${error.message}`
      );
    }
  }

  async deleteFile(
    path: string
  ): Promise<void> {

    const { error } =
      await this.client.storage
        .from(this.bucket)
        .remove([
          path,
        ]);

    if (error) {
      throw new Error(
        `Failed to delete file: ${error.message}`
      );
    }
  }
}