// Crowdbeats V2 — CrowdbeatsLocationSearch Widget
//
// Prominent geographic search bar with Places autocomplete dropdown/modal sheet.
// Supports searches across cities (Torrance, Palm Springs, LA, San Diego, Austin, Nashville, London, Auckland).

import 'package:flutter/material.dart';
import '../../../data/models/discovery.dart';

class CrowdbeatsLocationSearch extends StatelessWidget {
  const CrowdbeatsLocationSearch({
    super.key,
    this.placeholder = 'Search city, town, state or country',
    required this.currentLocationName,
    required this.isSearchAreaMode,
    required this.onSelectLocation,
    required this.onUseMyLocation,
    required this.suggestions,
    required this.onSearchInput,
  });

  final String placeholder;
  final String currentLocationName;
  final bool isSearchAreaMode;
  final ValueChanged<DiscoveryLocation> onSelectLocation;
  final VoidCallback onUseMyLocation;
  final List<DiscoveryLocation> suggestions;
  final ValueChanged<String> onSearchInput;

  void _openSearchSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF131315),
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.75,
          minChildSize: 0.5,
          maxChildSize: 0.95,
          expand: false,
          builder: (_, scrollController) {
            return _SearchModalContent(
              placeholder: placeholder,
              onSelectLocation: (loc) {
                Navigator.of(ctx).pop();
                onSelectLocation(loc);
              },
              onUseMyLocation: () {
                Navigator.of(ctx).pop();
                onUseMyLocation();
              },
              onSearchInput: onSearchInput,
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _openSearchSheet(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: const Color(0xFF1E2032),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSearchAreaMode
                ? const Color(0xFF7C3AED).withValues(alpha: 0.6)
                : Colors.white.withValues(alpha: 0.1),
            width: isSearchAreaMode ? 1.5 : 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.3),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            const Icon(
              Icons.search_rounded,
              color: Color(0xFFA855F7),
              size: 22,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                isSearchAreaMode ? currentLocationName : placeholder,
                style: TextStyle(
                  color: isSearchAreaMode ? Colors.white : const Color(0xFF94A3B8),
                  fontSize: 15,
                  fontWeight: isSearchAreaMode ? FontWeight.w600 : FontWeight.w400,
                  letterSpacing: -0.2,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (isSearchAreaMode) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF7C3AED).withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'Active Area',
                  style: TextStyle(
                    color: Color(0xFFA855F7),
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ] else ...[
              const Icon(
                Icons.tune_rounded,
                color: Color(0xFF64748B),
                size: 18,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SearchModalContent extends StatefulWidget {
  const _SearchModalContent({
    required this.placeholder,
    required this.onSelectLocation,
    required this.onUseMyLocation,
    required this.onSearchInput,
  });

  final String placeholder;
  final ValueChanged<DiscoveryLocation> onSelectLocation;
  final VoidCallback onUseMyLocation;
  final ValueChanged<String> onSearchInput;

  @override
  State<_SearchModalContent> createState() => _SearchModalContentState();
}

class _SearchModalContentState extends State<_SearchModalContent> {
  final _controller = TextEditingController();
  List<DiscoveryLocation> _filteredLocations = DiscoveryLocation.curatedLocations;

  void _onQueryChanged(String text) {
    widget.onSearchInput(text);
    setState(() {
      _filteredLocations = DiscoveryLocation.searchLocations(text);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Handle bar
        Center(
          child: Container(
            margin: const EdgeInsets.only(top: 12, bottom: 8),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        ),
        // Search textfield
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: TextField(
            controller: _controller,
            autofocus: true,
            onChanged: _onQueryChanged,
            style: const TextStyle(color: Colors.white, fontSize: 16),
            decoration: InputDecoration(
              hintText: widget.placeholder,
              hintStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 15),
              prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFFA855F7)),
              suffixIcon: _controller.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear_rounded, color: Color(0xFF94A3B8), size: 20),
                      onPressed: () {
                        _controller.clear();
                        _onQueryChanged('');
                      },
                    )
                  : null,
              filled: true,
              fillColor: const Color(0xFF1B1D28),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: Color(0xFF7C3AED), width: 1.5),
              ),
            ),
          ),
        ),
        // "Use My Location" quick action
        ListTile(
          leading: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFF7C3AED).withOpacity(0.15),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.my_location_rounded, color: Color(0xFFA855F7), size: 20),
          ),
          title: const Text(
            'Use My Location',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14),
          ),
          subtitle: const Text(
            'Explore live music near your current position',
            style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
          ),
          onTap: widget.onUseMyLocation,
        ),
        const Divider(color: Color(0xFF232533), height: 1),
        // Popular city chips
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text(
              'POPULAR MUSIC CITIES',
              style: TextStyle(
                color: const Color(0xFF94A3B8).withOpacity(0.8),
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.8,
              ),
            ),
          ),
        ),
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            itemCount: _filteredLocations.length,
            separatorBuilder: (_, __) => const Divider(color: Color(0xFF1E202C), height: 1),
            itemBuilder: (context, index) {
              final loc = _filteredLocations[index];
              return ListTile(
                contentPadding: const EdgeInsets.symmetric(vertical: 2),
                leading: const Icon(Icons.location_on_outlined, color: Color(0xFF94A3B8), size: 20),
                title: Text(
                  loc.city,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15),
                ),
                subtitle: Text(
                  '${loc.administrativeArea}, ${loc.country}',
                  style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                ),
                onTap: () => widget.onSelectLocation(loc),
              );
            },
          ),
        ),
      ],
    );
  }
}
