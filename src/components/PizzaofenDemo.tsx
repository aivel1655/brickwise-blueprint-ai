import React, { useState, useEffect } from 'react';
import EnhancedChatInterface from './ChatInterface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PizzaofenChatService } from '@/services/PizzaofenChatService';
import { ChatMessage } from '@/types';

const PizzaofenDemo: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatService] = useState(() => new PizzaofenChatService());
  const [currentState, setCurrentState] = useState(chatService.getCurrentState());

  // Initialize mit Welcome Message
  useEffect(() => {
    const initializeChat = async () => {
      const welcomeMessage = chatService['createWelcomeMessage']();
      setMessages([welcomeMessage]);
    };
    initializeChat();
  }, [chatService]);

  const handleSendMessage = async (content: string) => {
    setIsProcessing(true);

    try {
      let response: ChatMessage;
      
      // Prüfe ob es eine Alternative/Zusatzanfrage ist
      if (currentState.phase === 'complete') {
        response = await chatService.handleAlternativeRequest(content);
      } else {
        response = await chatService.processMessage(content);
      }

      // Update messages und state
      const allMessages = chatService.getConversationHistory();
      setMessages([...allMessages]);
      setCurrentState(chatService.getCurrentState());

    } catch (error) {
      console.error('Fehler beim Verarbeiten der Nachricht:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'agent',
        agent: 'requirements',
        content: `❌ Entschuldigung, es gab einen Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetChat = () => {
    chatService.reset();
    setMessages([]);
    setCurrentState(chatService.getCurrentState());
    
    // Neue Welcome Message
    const welcomeMessage = chatService['createWelcomeMessage']();
    setMessages([welcomeMessage]);
  };

  const getAgentDisplayName = (agent: string) => {
    switch (agent) {
      case 'requirements': return 'RequirementsAgent';
      case 'calculation': return 'CalculationAgent';
      case 'image': return 'ImageAgent';
      case 'summary': return 'SummaryAgent';
      default: return agent;
    }
  };

  const getPhaseProgress = () => {
    const phases = ['requirements', 'calculation', 'image_generation', 'summary', 'complete'];
    const currentIndex = phases.indexOf(currentState.phase);
    return {
      current: currentIndex + 1,
      total: phases.length,
      percentage: ((currentIndex + 1) / phases.length) * 100
    };
  };

  const progress = getPhaseProgress();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header mit Agent-Status */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                🍕 Pizzaofen Agenten Chat
                <Badge variant="outline" className="ml-2">
                  {getAgentDisplayName(currentState.currentAgent)} aktiv
                </Badge>
              </CardTitle>
              <CardDescription>
                Interaktiver Chat mit vier spezialisierten Agenten für Pizzaofen-Planung
              </CardDescription>
            </div>
            <Button variant="outline" onClick={resetChat} size="sm">
              Neuer Chat
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Fortschritt: Phase {progress.current} von {progress.total}</span>
              <span>{Math.round(progress.percentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
          </div>

          {/* Agent Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {[
              { id: 'requirements', name: 'Requirements', icon: '🤖', description: 'Sammelt Anforderungen' },
              { id: 'calculation', name: 'Calculation', icon: '💰', description: 'Berechnet Materialien' },
              { id: 'image', name: 'Image', icon: '🎨', description: 'Erstellt Visualisierung' },
              { id: 'summary', name: 'Summary', icon: '📋', description: 'Finale Einkaufsliste' }
            ].map((agent) => {
              const isActive = currentState.currentAgent === agent.id;
              const isCompleted = ['calculation', 'image_generation', 'summary', 'complete'].includes(currentState.phase) && 
                               ['requirements', 'calculation', 'image'].indexOf(agent.id) < ['requirements', 'calculation', 'image', 'summary'].indexOf(currentState.currentAgent);
              
              return (
                <div 
                  key={agent.id}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    isActive 
                      ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/30'
                      : isCompleted
                      ? 'bg-green-50 border-green-300 dark:bg-green-900/30'
                      : 'bg-gray-50 border-gray-200 dark:bg-gray-800'
                  }`}
                >
                  <div className="text-2xl mb-1">{agent.icon}</div>
                  <div className="font-semibold text-sm">{agent.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{agent.description}</div>
                  {isActive && <div className="text-xs text-blue-600 mt-1">● Aktiv</div>}
                  {isCompleted && <div className="text-xs text-green-600 mt-1">✓ Abgeschlossen</div>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat */}
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <CardContent className="p-0 h-full">
              <EnhancedChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                isProcessing={isProcessing}
                suggestions={messages[messages.length - 1]?.data?.suggestions || []}
              />
            </CardContent>
          </Card>
        </div>

        {/* Status Panel */}
        <div className="space-y-4">
          {/* Aktuelle Anforderungen */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📋 Aktuelle Anforderungen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Fläche:</span>
                  <span className="font-medium">
                    {currentState.requirements.area_sqm ? `${currentState.requirements.area_sqm} qm` : 'Nicht angegeben'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Qualität:</span>
                  <span className="font-medium capitalize">
                    {currentState.requirements.quality_option || 'Nicht angegeben'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant="outline" size="sm">
                    {currentState.phase === 'complete' ? 'Abgeschlossen' : 'In Bearbeitung'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ergebnis Preview */}
          {currentState.result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">💰 Kostenschätzung</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      €{currentState.result.total_cost.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Gesamtkosten</div>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Bauzeit:</span>
                      <span className="font-medium">{currentState.result.estimated_build_time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Materialien:</span>
                      <span className="font-medium">{currentState.result.components.length} Artikel</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="text-xs text-gray-600 mb-1">Top Materialien:</div>
                    {currentState.result.components.slice(0, 3).map((comp, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span>{comp.name}</span>
                        <span>€{comp.total_price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">⚡ Schnellaktionen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {currentState.phase === 'complete' ? (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleSendMessage('Zeige günstigere Alternativen')}
                      disabled={isProcessing}
                    >
                      💰 Günstigere Optionen
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleSendMessage('Was kostet premium Qualität?')}
                      disabled={isProcessing}
                    >
                      ⭐ Premium Qualität
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleSendMessage('Neuen Pizzaofen konfigurieren')}
                      disabled={isProcessing}
                    >
                      🔄 Neu konfigurieren
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleSendMessage('1.5 qm Pizzaofen günstig')}
                      disabled={isProcessing}
                    >
                      🍕 Standard günstig
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleSendMessage('2.0 qm Pizzaofen premium')}
                      disabled={isProcessing}
                    >
                      🍕 Groß premium
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PizzaofenDemo;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Pizzaofen Agenten Demo</CardTitle>
          <CardDescription>
            Automatische Tests aller vier Agenten mit verschiedenen Konfigurationen
          </CardDescription>
          <Button 
            onClick={runAllDemos} 
            disabled={isRunning}
            className="w-fit"
          >
            {isRunning ? 'Demo läuft...' : 'Demo erneut ausführen'}
          </Button>
        </CardHeader>
      </Card>

      {isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <span>Agenten werden ausgeführt...</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {demoResults.map((demo, index) => (
          <Card key={index} className={demo.success ? 'border-green-200' : 'border-red-200'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {demo.success ? '✅' : '❌'} {demo.name}
                <span className="text-sm font-normal text-gray-500">
                  ({demo.quality} • {demo.area} qm)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {demo.success ? (
                <div className="space-y-4">
                  {/* Zusammenfassung */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-600">Gesamtkosten</div>
                      <div className="text-xl font-bold text-green-600">
                        €{demo.result.total_cost.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Bauzeit</div>
                      <div className="font-semibold">{demo.result.estimated_build_time}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Komponenten</div>
                      <div className="font-semibold">{demo.result.components.length} Artikel</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Qualität</div>
                      <div className="font-semibold capitalize">{demo.result.quality_option}</div>
                    </div>
                  </div>

                  {/* Materialien */}
                  <div>
                    <h4 className="font-semibold mb-2">📦 Materialien:</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-1">Material</th>
                            <th className="text-center py-1">Menge</th>
                            <th className="text-right py-1">Einzelpreis</th>
                            <th className="text-right py-1">Gesamt</th>
                          </tr>
                        </thead>
                        <tbody>
                          {demo.result.components.map((component: any, idx: number) => (
                            <tr key={idx} className="border-b">
                              <td className="py-1">{component.name}</td>
                              <td className="py-1 text-center">{component.amount}</td>
                              <td className="py-1 text-right">€{component.price_per_unit.toFixed(2)}</td>
                              <td className="py-1 text-right font-semibold">€{component.total_price.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bild-Prompt */}
                  <div>
                    <h4 className="font-semibold mb-2">🎨 Generierter Bild-Prompt:</h4>
                    <div className="p-3 bg-blue-50 rounded-lg text-sm">
                      <p><strong>Beschreibung:</strong> {demo.result.image_prompt.description}</p>
                      <p><strong>Stil:</strong> {demo.result.image_prompt.style}</p>
                      <p><strong>Details:</strong> {demo.result.image_prompt.details.join(', ')}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-red-600">
                  <strong>Fehler:</strong> {demo.error}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {demoResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Demo-Zusammenfassung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {demoResults.filter(d => d.success).length}
                </div>
                <div className="text-sm text-green-700">Erfolgreiche Tests</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {demoResults.filter(d => !d.success).length}
                </div>
                <div className="text-sm text-red-700">Fehlgeschlagene Tests</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  €{demoResults
                    .filter(d => d.success)
                    .reduce((sum, d) => sum + d.result.total_cost, 0)
                    .toFixed(2)}
                </div>
                <div className="text-sm text-blue-700">Gesamtkosten aller Tests</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PizzaofenDemo;
