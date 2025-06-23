
# MultiBuildAgent

A comprehensive AI-powered construction planning application that helps users plan and build brick structures using multi-agent workflows and SAP Joule integration.

## Features

- **Multi-Agent Workflow**: Coordinated AI agents (Iteration, Strategic Planner, Builder, SAP Joule)
- **Interactive Chat Interface**: Conversational planning with real-time responses
- **SAP Joule Integration**: Catalog lookup, SKU verification, and alternative suggestions
- **Detailed Build Plans**: Step-by-step instructions with material lists and safety tips
- **Real-time Collaboration**: WebSocket support for live updates
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode**: Full dark/light theme support

## Architecture

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **UI Components**: Shadcn/ui component library
- **State Management**: React hooks with context
- **Styling**: Tailwind CSS with custom construction-themed colors
- **Icons**: Lucide React icons
- **Build Tool**: Vite for fast development and builds

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Modern web browser

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd MultiBuildAgent
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:8080`

## Usage

### Basic Workflow

1. **Initial Prompt**: Enter your construction goal (e.g., "I want to build a pizza oven")

2. **Iteration Phase**: The Iteration Agent will ask up to 3 follow-up questions:
   - Dimensions and specifications
   - Foundation requirements
   - Special requirements

3. **Strategic Planning**: The Strategic Planner creates a blueprint with:
   - Build phases
   - Material estimates
   - Cost calculations
   - Timeline estimates

4. **Build Instructions**: The Builder Agent generates:
   - Step-by-step instructions
   - Tool lists
   - Safety guidelines
   - Waste calculations

5. **SAP Joule Integration**: Automatic catalog verification and alternatives

### Example Projects

- Pizza ovens
- Garden walls
- Fire pits
- Outdoor kitchens
- Retaining walls

## Agent System

### Iteration Agent
- Collects user requirements
- Asks clarifying questions
- Validates specifications

### Strategic Planner
- Creates project blueprints
- Estimates materials and costs
- Plans construction phases

### Builder Agent
- Generates detailed instructions
- Calculates precise quantities
- Provides safety guidelines

### SAP Joule Integration
- Verifies material availability
- Suggests alternatives
- Checks pricing and SKUs

## Project Structure

```
src/
├── components/          # React components
│   ├── ChatInterface.tsx
│   ├── ChatBubble.tsx
│   ├── Header.tsx
│   └── ProjectTabs.tsx
├── services/           # Business logic
│   └── agentService.ts
├── types/             # TypeScript definitions
│   └── index.ts
├── pages/             # Page components
│   └── Index.tsx
└── styles/            # CSS and styling
    └── index.css
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- TypeScript for type safety
- ESLint + Prettier for code formatting
- Tailwind CSS for styling
- Functional components with hooks

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Deploy automatically on push to main branch

### Manual Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting provider

## Environment Variables

Create a `.env` file for configuration:

```env
VITE_SAP_JOULE_API_URL=your_sap_api_url
VITE_SAP_JOULE_API_KEY=your_api_key
```

## API Integration

### SAP Joule Integration

The application integrates with SAP Joule for:
- Material catalog lookup
- Price verification
- Alternative product suggestions
- Stock availability

### Example API Calls

```javascript
// Catalog search
const response = await fetch('/api/sap/catalog/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'firebrick', category: 'construction' })
});

// Price check
const prices = await fetch('/api/sap/pricing', {
  method: 'POST',
  body: JSON.stringify({ skus: ['FB-001', 'FB-002'] })
});
```

## License

MIT License - see LICENSE file for details

## Support

For questions and support:
- Create an issue on GitHub
- Check the documentation
- Contact the development team

## Roadmap

- [ ] Advanced 3D visualization
- [ ] Mobile app version
- [ ] Voice input support
- [ ] Multi-language support
- [ ] Integration with more suppliers
- [ ] AR visualization features
