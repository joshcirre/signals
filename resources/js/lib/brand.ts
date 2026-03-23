export const storeBrand = {
    name: 'Northstar Outfitters',
    adminName: 'Signals',
    tagline: 'Signal-led merchandising control for modern apparel teams.',
    shopperTagline:
        'Performance apparel refined by what customers actually say.',
    accent: 'Signal-led merchandising',
    collection: 'Alpine Motion',
    helperName: 'Signals Helper',
    helperStack: 'Codex local + Laravel MCP + Reverb',
};

export function proposalLabel(type: string): string {
    return type.replaceAll('_', ' ');
}
