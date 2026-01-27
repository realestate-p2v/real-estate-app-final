export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      orders: {
        Row: {
          id: string
          order_id: string
          customer_name: string | null
          customer_email: string | null
          customer_phone: string | null
          photos: Json
          photo_count: number
          music_selection: string | null
          custom_audio: Json | null
          branding: Json
          voiceover: boolean
          voiceover_script: string | null
          include_edited_photos: boolean
          special_instructions: string | null
          base_price: number
          branding_fee: number
          voiceover_fee: number
          edited_photos_fee: number
          total_price: number
          payment_status: string
          stripe_session_id: string | null
          stripe_payment_intent_id: string | null
          created_at: string
          updated_at: string
          status: string | null
          voiceover_voice: string | null
        }
        Insert: {
          id?: string
          order_id: string
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          photos?: Json
          photo_count?: number
          music_selection?: string | null
          custom_audio?: Json | null
          branding?: Json
          voiceover?: boolean
          voiceover_script?: string | null
          include_edited_photos?: boolean
          special_instructions?: string | null
          base_price?: number
          branding_fee?: number
          voiceover_fee?: number
          edited_photos_fee?: number
          total_price?: number
          payment_status?: string
          stripe_session_id?: string | null
          stripe_payment_intent_id?: string | null
          created_at?: string
          updated_at?: string
          status?: string | null
          voiceover_voice?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          photos?: Json
          photo_count?: number
          music_selection?: string | null
          custom_audio?: Json | null
          branding?: Json
          voiceover?: boolean
          voiceover_script?: string | null
          include_edited_photos?: boolean
          special_instructions?: string | null
          base_price?: number
          branding_fee?: number
          voiceover_fee?: number
          edited_photos_fee?: number
          total_price?: number
          payment_status?: string
          stripe_session_id?: string | null
          stripe_payment_intent_id?: string | null
          created_at?: string
          updated_at?: string
          status?: string | null
          voiceover_voice?: string | null
        }
      }
    }
  }
}
