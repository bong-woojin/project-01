import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// createClient: Supabase 서버와 통신할 클라이언트 객체를 만듦
// 앱 전체에서 이 파일을 import해서 하나의 클라이언트만 사용
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
