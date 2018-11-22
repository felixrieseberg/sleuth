export function getTheme(isDark: boolean = false) {
  if (isDark) {
    return {
      base00: '#30404d',
      base01: '#34495E',
      base02: '#7F8C8D',
      base03: '#95A5A6',
      base04: '#BDC3C7',
      base05: '#e0e0e0',
      base06: '#f5f5f5',
      base07: '#ECF0F1',
      base08: '#E74C3C',
      base09: '#E67E22',
      base0A: '#F1C40F',
      base0B: '#2ECC71',
      base0C: '#1ABC9C',
      base0D: '#3498DB',
      base0E: '#9B59B6',
      base0F: '#be643c'
    };
  }

  return {
    base00: '#2C2D30',
    base01: '#555459',
    base02: '#8B898F',
    base03: '#88919B',
    base04: '#9e9ea6',
    base05: '#FBFBFA',
    base06: '#F9F9F9',
    base07: '#ffffff',
    base08: '#e32072',
    base09: '#F96A38',
    base0A: '#FFA940',
    base0B: '#257337',
    base0C: '#3971ED',
    base0D: '#3971ED',
    base0E: '#71105F',
    base0F: '#4d6dc3'
  };
}
