import { supabase } from './supabase.js'

export async function login(email, password) {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    alert(error.message)
  } else {
    alert('Login exitoso')
  }
}

export async function register(email, password) {
  const { error } = await supabase.auth.signUp({
    email,
    password
  })

  if (error) {
    alert(error.message)
  } else {
    alert('Registro exitoso. Revisá tu email.')
  }
}
