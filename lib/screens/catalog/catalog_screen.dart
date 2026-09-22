import 'package:flutter/material.dart';
import '../../models/producto_model.dart';
import '../../services/cliente_service.dart';
import 'product_detail_screen.dart';

class CatalogScreen extends StatefulWidget {
  final bool showAppBar;

  const CatalogScreen({super.key, this.showAppBar = true});

  @override
  State<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends State<CatalogScreen> {
  final ClienteService _clienteService = ClienteService();
  late Future<List<Producto>> _futureProductos;
  String _categoriaSeleccionada = 'Todos';

  List<String> _categorias = [
    'Todos',
    'Cascos',
    'Guantes',
    'Botas',
    'Chalecos',
    'Camisas',
    'Pantalones',
  ];

  @override
  void initState() {
    super.initState();
    _cargarCategorias();
    _cargarProductos();
  }

  Future<void> _cargarCategorias() async {
    try {
      final cats = await _clienteService.obtenerCategorias();
      if (mounted && cats.isNotEmpty) {
        setState(() {
          _categorias = cats;
        });
      }
    } catch (_) {}
  }

  void _cargarProductos() {
    setState(() {
      _futureProductos = _clienteService.obtenerProductos(
        categoria: _categoriaSeleccionada,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: widget.showAppBar
          ? AppBar(
              title: const Text('Catálogo Tecnomatic'),
              actions: [
                IconButton(
                  icon: const Icon(Icons.refresh),
                  onPressed: () {
                    _cargarCategorias();
                    _cargarProductos();
                  },
                ),
              ],
            )
          : null,
      body: Column(
        children: [
          // Selector horizontal de Categorías
          Container(
            height: 52,
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
            ),
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              itemCount: _categorias.length,
              itemBuilder: (context, index) {
                final cat = _categorias[index];
                final esSeleccionado = cat == _categoriaSeleccionada;
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: FilterChip(
                    label: Text(
                      cat,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: esSeleccionado ? FontWeight.bold : FontWeight.normal,
                        color: esSeleccionado ? Colors.white : const Color(0xFF334155),
                      ),
                    ),
                    selected: esSeleccionado,
                    selectedColor: const Color(0xFF0047AB),
                    backgroundColor: const Color(0xFFF1F5F9),
                    checkmarkColor: Colors.white,
                    side: BorderSide(
                      color: esSeleccionado ? const Color(0xFF0047AB) : const Color(0xFFE2E8F0),
                    ),
                    onSelected: (bool selected) {
                      setState(() {
                        _categoriaSeleccionada = cat;
                        _cargarProductos();
                      });
                    },
                  ),
                );
              },
            ),
          ),
          
          // Grilla de productos
          Expanded(
            child: FutureBuilder<List<Producto>>(
              future: _futureProductos,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                } else if (snapshot.hasError) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Text(
                        'Error de conexión:\n${snapshot.error}',
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.red),
                      ),
                    ),
                  );
                } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
                  return const Center(
                    child: Text('No hay productos en esta categoría'),
                  );
                }

                final productos = snapshot.data!;

                return GridView.builder(
                  padding: const EdgeInsets.all(12),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.7,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                  ),
                  itemCount: productos.length,
                  itemBuilder: (context, index) {
                    final producto = productos[index];
                    return InkWell(
                      onTap: () {
                        // Navegación a la vista de detalle
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => ProductDetailScreen(producto: producto),
                          ),
                        );
                      },
                      child: Card(
                        elevation: 3,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: ClipRRect(
                                borderRadius: const BorderRadius.vertical(
                                  top: Radius.circular(12),
                                ),
                                child: producto.imagen != null && producto.imagen!.isNotEmpty
                                    ? Image.network(
                                        producto.imagen!,
                                        width: double.infinity,
                                        fit: BoxFit.cover,
                                        errorBuilder: (context, error, stackTrace) =>
                                            const Icon(Icons.broken_image, size: 50),
                                      )
                                    : const Icon(Icons.image, size: 50),
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.all(8.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    producto.nombre,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '\$${producto.precio.toStringAsFixed(0)}',
                                    style: const TextStyle(
                                      color: Colors.green,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Stock: ${producto.stock}',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}