import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PizzaofenAgents, ShoppingList, RequirementsInput } from '@/services/PizzaofenAgents';

type QualityOption = 'schnell' | 'günstig' | 'premium';

interface PizzaofenResult extends ShoppingList {
  image_url?: string;
}

const PizzaofenCalculator: React.FC = () => {
  const [selectedQuality, setSelectedQuality] = useState<QualityOption | null>(null);
  const [result, setResult] = useState<PizzaofenResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [area, setArea] = useState<number>(1.5);

  // Button-Konfigurationen mit Farben und Beschreibungen
  const qualityOptions = {
    schnell: {
      label: 'Schnell',
      description: 'Optimiert für schnelle Fertigstellung',
      color: 'bg-blue-500 hover:bg-blue-600',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50'
    },
    günstig: {
      label: 'Günstig',
      description: 'Beste Preis-Leistung',
      color: 'bg-green-500 hover:bg-green-600',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50'
    },
    premium: {
      label: 'Premium',
      description: 'Höchste Qualität und Haltbarkeit',
      color: 'bg-purple-500 hover:bg-purple-600',
      textColor: 'text-purple-700',
      bgColor: 'bg-purple-50'
    }
  };

  const handleQualitySelect = async (quality: QualityOption) => {
    setLoading(true);
    setSelectedQuality(quality);

    try {
      // Eingabedaten vorbereiten
      const input: Partial<RequirementsInput> = {
        area_sqm: area,
        quality_option: quality
      };

      // Agenten ausführen
      const result = PizzaofenAgents.runDemo(input);
      
      // Simuliere API-Aufruf Verzögerung
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setResult(result as PizzaofenResult);
    } catch (error) {
      console.error('Fehler bei der Berechnung:', error);
      alert('Fehler bei der Berechnung. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const resetCalculation = () => {
    setSelectedQuality(null);
    setResult(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">🍕 Pizzaofen Konfigurator</h1>
        <p className="text-gray-600">
          Wählen Sie Ihre gewünschte Qualitätsstufe und erhalten Sie eine detaillierte Einkaufsliste
        </p>
      </div>

      {/* Flächeneingabe */}
      <Card>
        <CardHeader>
          <CardTitle>📏 Ofengröße</CardTitle>
          <CardDescription>Gewünschte Grundfläche des Pizzaofens</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <label htmlFor="area" className="text-sm font-medium">
              Fläche (qm):
            </label>
            <input
              id="area"
              type="number"
              min="1.2"
              max="2.5"
              step="0.1"
              value={area}
              onChange={(e) => setArea(parseFloat(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500">(1.2 - 2.5 qm)</span>
          </div>
        </CardContent>
      </Card>

      {/* Qualitäts-Buttons */}
      {!result && (
        <Card>
          <CardHeader>
            <CardTitle>⚡ Qualitätsstufe wählen</CardTitle>
            <CardDescription>
              Jede Option bietet unterschiedliche Vorteile für Ihren Pizzaofen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {Object.entries(qualityOptions).map(([key, option]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="lg"
                  onClick={() => handleQualitySelect(key as QualityOption)}
                  disabled={loading}
                  className={`h-auto p-6 flex flex-col items-center space-y-2 transition-all duration-200 ${
                    selectedQuality === key ? option.color + ' text-white' : 'hover:shadow-lg'
                  }`}
                >
                  <div className="text-xl font-bold">{option.label}</div>
                  <div className="text-sm text-center opacity-80">
                    {option.description}
                  </div>
                  {loading && selectedQuality === key && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ergebnisse */}
      {result && (
        <div className="space-y-6">
          {/* Zusammenfassung */}
          <Card className={qualityOptions[result.quality_option as QualityOption].bgColor}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="secondary" className={qualityOptions[result.quality_option as QualityOption].textColor}>
                      {qualityOptions[result.quality_option as QualityOption].label}
                    </Badge>
                    {result.project}
                  </CardTitle>
                  <CardDescription>
                    Fläche: {area} qm • Bauzeit: {result.estimated_build_time}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={resetCalculation}>
                  Neu berechnen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                Gesamtkosten: €{result.total_cost.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          {/* Bild */}
          {result.image_url && (
            <Card>
              <CardHeader>
                <CardTitle>🎨 Ihr Pizzaofen</CardTitle>
                <CardDescription>Visualisierung basierend auf Ihren Spezifikationen</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full max-w-2xl mx-auto">
                  <img
                    src={result.image_url}
                    alt="Pizzaofen Visualisierung"
                    className="w-full h-64 object-cover rounded-lg shadow-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Bildspezifikationen:</h4>
                    <p className="text-sm text-gray-600 mb-2">{result.image_prompt.description}</p>
                    <p className="text-sm text-gray-500">Stil: {result.image_prompt.style}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Einkaufsliste */}
          <Card>
            <CardHeader>
              <CardTitle>🛒 Einkaufsliste</CardTitle>
              <CardDescription>
                Alle benötigten Materialien für Ihren {qualityOptions[result.quality_option as QualityOption].label} Pizzaofen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-semibold">Material</th>
                      <th className="text-center py-2 font-semibold">Menge</th>
                      <th className="text-right py-2 font-semibold">Einzelpreis</th>
                      <th className="text-right py-2 font-semibold">Gesamtpreis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.components.map((component, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 font-medium">{component.name}</td>
                        <td className="py-3 text-center">{component.amount} Stück</td>
                        <td className="py-3 text-right">€{component.price_per_unit.toFixed(2)}</td>
                        <td className="py-3 text-right font-semibold">
                          €{component.total_price.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300">
                      <td colSpan={3} className="py-3 text-right font-bold text-lg">
                        Gesamtsumme:
                      </td>
                      <td className="py-3 text-right font-bold text-lg text-green-600">
                        €{result.total_cost.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <Separator className="my-6" />

              {/* Zusätzliche Informationen */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">⏱️ Bauzeit</h4>
                  <p className="text-gray-600">{result.estimated_build_time}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">📋 Qualitätsstufe</h4>
                  <Badge className={qualityOptions[result.quality_option as QualityOption].textColor}>
                    {qualityOptions[result.quality_option as QualityOption].label}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bild-Details */}
          {result.image_prompt && (
            <Card>
              <CardHeader>
                <CardTitle>🖼️ Bildspezifikationen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Beschreibung:</strong> {result.image_prompt.description}</p>
                  <p><strong>Stil:</strong> {result.image_prompt.style}</p>
                  <div>
                    <strong>Details:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {result.image_prompt.details.map((detail, index) => (
                        <li key={index} className="text-gray-600">{detail}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default PizzaofenCalculator;
