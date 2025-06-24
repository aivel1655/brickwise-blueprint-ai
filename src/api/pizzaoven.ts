import express, { Request, Response } from 'express';
import { PizzaofenAgents, RequirementsInput, ShoppingList } from '../services/PizzaofenAgents';

const router = express.Router();

/**
 * POST /api/pizzaoven/calculate
 * Hauptendpunkt für Pizzaofen-Berechnungen
 */
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    console.log('📝 API: Pizzaofen-Berechnung gestartet', req.body);

    const input: Partial<RequirementsInput> = {
      area_sqm: req.body.area_sqm || 1.5,
      material_preference: req.body.material_preference,
      quality_option: req.body.quality_option || 'günstig'
    };

    // Validierung der Eingabe
    if (!['schnell', 'günstig', 'premium'].includes(input.quality_option!)) {
      return res.status(400).json({
        error: 'Ungültige Qualitätsoption. Erlaubt: schnell, günstig, premium'
      });
    }

    if (input.area_sqm! < 1.2 || input.area_sqm! > 2.5) {
      return res.status(400).json({
        error: 'Fläche muss zwischen 1.2 und 2.5 qm liegen'
      });
    }

    // Agenten ausführen
    const result = PizzaofenAgents.runDemo(input);

    // Erfolgreiche Antwort
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ API Fehler:', error);
    res.status(500).json({
      error: 'Interner Serverfehler bei der Berechnung',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
});

/**
 * GET /api/pizzaoven/options/:quality
 * Schneller Zugriff auf spezifische Qualitätsoption
 */
router.get('/options/:quality', async (req: Request, res: Response) => {
  try {
    const quality = req.params.quality as 'schnell' | 'günstig' | 'premium';
    const area = parseFloat(req.query.area as string) || 1.5;

    console.log(`🔍 API: Optionen für ${quality} angefragt (${area} qm)`);

    if (!['schnell', 'günstig', 'premium'].includes(quality)) {
      return res.status(400).json({
        error: 'Ungültige Qualitätsoption'
      });
    }

    const input: Partial<RequirementsInput> = {
      area_sqm: area,
      quality_option: quality
    };

    const result = PizzaofenAgents.runDemo(input);

    res.json({
      success: true,
      quality_option: quality,
      area_sqm: area,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ API Fehler bei Optionen:', error);
    res.status(500).json({
      error: 'Fehler beim Laden der Optionen',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
});

/**
 * GET /api/pizzaoven/demo
 * Demo-Endpunkt mit verschiedenen Beispielen
 */
router.get('/demo', async (req: Request, res: Response) => {
  try {
    console.log('🎮 API: Demo-Modus gestartet');

    const demos = [
      { quality: 'günstig', area: 1.2, label: 'Kompakter Ofen' },
      { quality: 'schnell', area: 1.8, label: 'Standard Ofen' },
      { quality: 'premium', area: 2.5, label: 'Großer Ofen' }
    ];

    const results = demos.map(demo => {
      const input: Partial<RequirementsInput> = {
        area_sqm: demo.area,
        quality_option: demo.quality as any
      };
      
      return {
        label: demo.label,
        parameters: demo,
        result: PizzaofenAgents.runDemo(input)
      };
    });

    res.json({
      success: true,
      demo_results: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Demo Fehler:', error);
    res.status(500).json({
      error: 'Fehler im Demo-Modus'
    });
  }
});

/**
 * GET /api/pizzaoven/materials
 * Rohdaten der verfügbaren Materialien
 */
router.get('/materials', (req: Request, res: Response) => {
  try {
    const pizzaovenData = require('../data/mock-pizzaoven.json');
    
    res.json({
      success: true,
      materials: pizzaovenData.components,
      project_info: {
        name: pizzaovenData.project,
        requirements: pizzaovenData.requirements
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Fehler beim Laden der Materialien:', error);
    res.status(500).json({
      error: 'Fehler beim Laden der Materialien'
    });
  }
});

export default router;
