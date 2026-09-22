import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/session/session_manager.dart';
import '../models/usuario_model.dart';

class AuthService {
  SupabaseClient get _supabase => Supabase.instance.client;

  // Inicio de sesión compatible con Supabase
  Future<Usuario> login(String correo, String contrasena) async {
    final emailLimpio = correo.trim().toLowerCase();

    try {
      // 1. Consulta directa a la tabla Usuarios (tabla oficial en Supabase)
      try {
        final res = await _supabase
            .from('Usuarios')
            .select('*')
            .ilike('Correo', emailLimpio)
            .maybeSingle();

        if (res != null) {
          final dbPass = res['Contrasena']?.toString() ?? res['contrasena']?.toString() ?? '';
          if (dbPass.isEmpty || dbPass == contrasena) {
            final usuario = Usuario.fromJson(res);
            SessionManager().iniciarSesion(usuario, token: 'supa-user-${usuario.id}');
            return usuario;
          } else {
            throw Exception('Contraseña incorrecta. Por favor verifícala.');
          }
        }
      } catch (e) {
        if (e.toString().contains('Contraseña incorrecta')) rethrow;
        debugPrint('Aviso consulta Usuarios: $e');
      }

      // 2. Intentar Supabase Auth oficial como respaldo
      try {
        final authResponse = await _supabase.auth.signInWithPassword(
          email: emailLimpio,
          password: contrasena,
        );

        if (authResponse.user != null) {
          final authUser = authResponse.user!;
          final meta = authUser.userMetadata ?? {};

          Map<String, dynamic>? profile;
          try {
            profile = await _supabase
                .from('Usuarios')
                .select('*')
                .ilike('Correo', emailLimpio)
                .maybeSingle();
          } catch (_) {}

          final usuario = profile != null
              ? Usuario.fromJson(profile)
              : Usuario(
                  id: authUser.id,
                  nombre: '${meta['nombres'] ?? 'Usuario'} ${meta['apellidos'] ?? ''}'.trim(),
                  correo: authUser.email ?? emailLimpio,
                  rol: 'Cliente',
                  rolId: 3,
                );

          SessionManager().iniciarSesion(usuario, token: authResponse.session?.accessToken);
          return usuario;
        }
      } catch (e) {
        debugPrint('Supabase Auth error: $e');
      }

      throw Exception('Usuario no encontrado o credenciales incorrectas.');
    } catch (e) {
      if (e is Exception && !e.toString().contains('SocketException')) {
        rethrow;
      }
      throw Exception('No se pudo conectar con Supabase. Verifica tu conexión a internet.');
    }
  }

  // Registro de nuevos usuarios (Rol 3 = Cliente)
  Future<Map<String, dynamic>> registrar({
    required String nombres,
    required String apellidos,
    required String correo,
    required String contrasena,
  }) async {
    final emailLimpio = correo.trim().toLowerCase();
    final nombreCompleto = '${nombres.trim()} ${apellidos.trim()}'.trim();

    try {
      // 1. Verificar si el correo ya existe en Usuarios
      try {
        final existente = await _supabase
            .from('Usuarios')
            .select('idUsuarios')
            .ilike('Correo', emailLimpio)
            .maybeSingle();

        if (existente != null) {
          throw Exception('Ya existe una cuenta registrada con el correo $emailLimpio.');
        }
      } catch (e) {
        if (e.toString().contains('Ya existe')) rethrow;
      }

      // 2. Insertar en tabla Usuarios de Supabase
      Map<String, dynamic>? nuevoUsuarioMap;
      try {
        final insertData = {
          'Nombres': nombres.trim(),
          'Apellidos': apellidos.trim(),
          'Correo': emailLimpio,
          'Contrasena': contrasena,
          'Roles_idRoles': 3, // Cliente
        };

        final res = await _supabase.from('Usuarios').insert(insertData).select().single();
        nuevoUsuarioMap = res;
      } catch (e) {
        debugPrint('Insert Usuarios error: $e');
        throw Exception('Error al guardar datos de usuario en Supabase: $e');
      }

      // 3. Crear en Supabase Auth en segundo plano
      String? token;
      try {
        final authRes = await _supabase.auth.signUp(
          email: emailLimpio,
          password: contrasena,
          data: {
            'nombres': nombres.trim(),
            'apellidos': apellidos.trim(),
            'nombre': nombreCompleto,
          },
        );
        token = authRes.session?.accessToken;
      } catch (_) {}

      final usuario = Usuario.fromJson(nuevoUsuarioMap);
      SessionManager().iniciarSesion(usuario, token: token ?? 'supa-user-${usuario.id}');

      return {
        'ok': true,
        'message': 'Usuario registrado exitosamente en Supabase',
        'usuario': usuario.toJson(),
        'token': token ?? 'supa-user-${usuario.id}',
      };
    } catch (e) {
      throw Exception(e.toString().replaceAll('Exception: ', ''));
    }
  }
}