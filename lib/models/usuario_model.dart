class Usuario {
  final dynamic id; // UUID String o entero
  final String nombre;
  final String correo;
  final String rol;
  final int rolId;
  final String? telefono;
  final String? direccion;

  Usuario({
    required this.id,
    required this.nombre,
    required this.correo,
    required this.rol,
    this.rolId = 3,
    this.telefono,
    this.direccion,
  });

  String get idStr => id.toString();

  factory Usuario.fromJson(Map<String, dynamic> json) {
    // Resolver nombre
    String resolvedNombre = json['Nombre']?.toString() ?? json['nombre']?.toString() ?? '';
    if (resolvedNombre.isEmpty) {
      final nombres = json['nombres']?.toString() ?? json['Nombres']?.toString() ?? '';
      final apellidos = json['apellidos']?.toString() ?? json['Apellidos']?.toString() ?? '';
      resolvedNombre = '$nombres $apellidos'.trim();
    }

    // Resolver rol ID y nombre
    int resolvedRolId = 3;
    final dynamic rawRolId = json['rol_id'] ?? json['Roles_idRoles'] ?? json['rolId'];
    if (rawRolId != null) {
      resolvedRolId = int.tryParse(rawRolId.toString()) ?? 3;
    }

    String resolvedRol = json['Rol']?.toString() ??
        json['rol']?.toString() ??
        json['roles']?['nombre_rol']?.toString() ??
        json['nombre_rol']?.toString() ??
        '';

    if (resolvedRol.isEmpty) {
      if (resolvedRolId == 1) {
        resolvedRol = 'Administrador';
      } else if (resolvedRolId == 2) {
        resolvedRol = 'Contador';
      } else {
        resolvedRol = 'Cliente';
      }
    } else {
      // Normalizar nombre de rol
      if (resolvedRol.toLowerCase().contains('admin')) {
        resolvedRol = 'Administrador';
        resolvedRolId = 1;
      } else if (resolvedRol.toLowerCase().contains('cont')) {
        resolvedRol = 'Contador';
        resolvedRolId = 2;
      } else {
        resolvedRol = 'Cliente';
        resolvedRolId = 3;
      }
    }

    return Usuario(
      id: json['id'] ?? json['idUsuario'] ?? json['idUsuarios'] ?? json['auth_id'] ?? 'user-default',
      nombre: resolvedNombre.isNotEmpty ? resolvedNombre : 'Usuario',
      correo: json['correo']?.toString() ?? json['Correo']?.toString() ?? '',
      rol: resolvedRol,
      rolId: resolvedRolId,
      telefono: json['telefono']?.toString() ?? json['Telefono']?.toString(),
      direccion: json['direccion']?.toString() ?? json['Direccion']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nombre': nombre,
      'correo': correo,
      'rol': rol,
      'rol_id': rolId,
      'telefono': telefono,
      'direccion': direccion,
    };
  }
}