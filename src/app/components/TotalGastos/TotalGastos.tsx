'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {  ChevronDown, ChevronUp, Plus, Edit2, Trash2, Save, X, User2 } from 'lucide-react';
import styles from './TotalGastos.module.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

type Gasto = {
  id: string;
  concepto: string;
  monto: number;
  fecha: string;
  moneda: 'USD' | 'ARS';
  persona: 'Facu' | 'Cande';
};

const TotalGastos = () => {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [monedaActual, setMonedaActual] = useState<'USD' | 'ARS'>('USD');
  const [cotizacionDolar, setCotizacionDolar] = useState(1280);
  const [editandoCotizacion, setEditandoCotizacion] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nuevoGasto, setNuevoGasto] = useState<Partial<Gasto>>({
    concepto: '',
    monto: 0,
    moneda: 'USD',
    persona: 'Facu'
  });

  useEffect(() => {
    cargarGastos(); 
  }, []);

  const cargarGastos = async () => {
    const { data, error } = await supabase
      .from('gastos')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) {
      console.error('Error cargando gastos:', error);
      return;
    }

    setGastos(data || []);
  };

  const agregarGasto = async () => {
    if (!nuevoGasto.concepto || !nuevoGasto.monto || !nuevoGasto.persona) return;

    const { data, error } = await supabase
      .from('gastos')
      .insert([{
        ...nuevoGasto,
        fecha: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('Error agregando gasto:', error);
      return;
    }

    setGastos([...(data || []), ...gastos]);
    setNuevoGasto({ concepto: '', monto: 0, moneda: 'USD', persona: 'Facu' });
  };

  const editarGasto = async (id: string) => {
    const gastoEditado = gastos.find(g => g.id === id);
    if (!gastoEditado) return;

    const { error } = await supabase
      .from('gastos')
      .update(gastoEditado)
      .eq('id', id);

    if (error) {
      console.error('Error editando gasto:', error);
      return;
    }

    setEditandoId(null);
  };

  const eliminarGasto = async (id: string) => {
    const { error } = await supabase
      .from('gastos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error eliminando gasto:', error);
      return;
    }

    setGastos(gastos.filter(g => g.id !== id));
  };

  const calcularTotalPorPersona = (persona: 'Facu' | 'Cande') => {
    return gastos
      .filter(gasto => gasto.persona === persona)
      .reduce((total, gasto) => {
        const monto = gasto.moneda === 'USD' ? 
          gasto.monto : 
          gasto.monto / cotizacionDolar;
        return total + monto;
      }, 0);
  };

  const calcularTotal = () => {
    return gastos.reduce((total, gasto) => {
      const monto = gasto.moneda === 'USD' ? 
        gasto.monto : 
        gasto.monto / cotizacionDolar;
      return total + monto;
    }, 0);
  };

  const calcularBalance = () => {
    const totalFacu = calcularTotalPorPersona('Facu');
    const totalCande = calcularTotalPorPersona('Cande');
    const diferencia = Math.abs(totalFacu - totalCande);
    const deudor = totalFacu > totalCande ? 'Cande' : 'Facu';
    const acreedor = totalFacu > totalCande ? 'Facu' : 'Cande';
    return {
      diferencia: diferencia / 2,
      deudor,
      acreedor
    };
  };

  const formatearMonto = (monto: number) => {
    const formatoNumero = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    });
  
    if (monedaActual === 'USD') {
      return `$${formatoNumero.format(monto)}`;
    }
    return `$${formatoNumero.format(monto * cotizacionDolar)}`;
  };

  const totalGastos = calcularTotal();
  const gastosFacu = calcularTotalPorPersona('Facu');
  const gastosCande = calcularTotalPorPersona('Cande');
  const balance = calcularBalance();

  return (
    <div className={styles.gastosContainer}>
      <div className={styles.totalDisplay}>
      <div className={styles.monedaSelector}>
            <button 
            className={monedaActual === 'USD' ? styles.active : ''}
            onClick={() => setMonedaActual('USD')}
            >
            USD
            </button>
            <button 
            className={monedaActual === 'ARS' ? styles.active : ''}
            onClick={() => setMonedaActual('ARS')}
            >
            ARS
            </button>
            <div className={styles.cotizacionContainer}>
            {editandoCotizacion ? (
                <div className={styles.cotizacionEdit}>
                <input
                    type="number"
                    value={cotizacionDolar}
                    onChange={(e) => setCotizacionDolar(Number(e.target.value))}
                    onBlur={() => setEditandoCotizacion(false)}
                    autoFocus
                    className={styles.cotizacionInput}
                />
                </div>
            ) : (
                <button 
                className={styles.cotizacionButton}
                onClick={() => setEditandoCotizacion(true)}
                >
                1 USD = {new Intl.NumberFormat('es-AR').format(cotizacionDolar)} ARS
                </button>
            )}
            </div>
        </div>
        <div className={styles.totales}>
          <div className={styles.totalAmount}>
            <span>Total Gastos:</span>
            <strong>{formatearMonto(totalGastos)}</strong>
          </div>
          <div className={styles.personaTotales}>
            <div className={styles.personaAmount}>
              <span>Facu:</span>
              <strong>{formatearMonto(gastosFacu)}</strong>
            </div>
            <div className={styles.personaAmount}>
              <span>Cande:</span>
              <strong>{formatearMonto(gastosCande)}</strong>
            </div>
          </div>
          <div className={styles.balance}>
            <span>{balance.deudor} debe a {balance.acreedor}:</span>
            <strong>{formatearMonto(balance.diferencia)}</strong>
          </div>
        </div>
      </div>

      <div className={styles.gastosHeader} onClick={() => setIsOpen(!isOpen)}>
        <h2>GASTOS</h2>
        {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
      </div>

      {isOpen && (
        <div className={styles.gastosContent}>
          <div className={styles.nuevoGasto}>
            <input
              type="text"
              placeholder="Concepto"
              value={nuevoGasto.concepto}
              onChange={e => setNuevoGasto({...nuevoGasto, concepto: e.target.value})}
            />
            <input
              type="number"
              placeholder="Monto"
              value={nuevoGasto.monto || ''}
              onChange={e => setNuevoGasto({...nuevoGasto, monto: parseFloat(e.target.value)})}
            />
            <select
              value={nuevoGasto.moneda}
              onChange={e => setNuevoGasto({...nuevoGasto, moneda: e.target.value as 'USD' | 'ARS'})}
            >
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
            </select>
            <select
              value={nuevoGasto.persona}
              onChange={e => setNuevoGasto({...nuevoGasto, persona: e.target.value as 'Facu' | 'Cande'})}
              className={styles.personaSelect}
            >
              <option value="Facu">Facu</option>
              <option value="Cande">Cande</option>
            </select>
            <button onClick={agregarGasto} className={styles.addButton}>
              <Plus size={20} />
            </button>
          </div>

          <ul className={styles.gastosList}>
            {gastos.map(gasto => (
              <li key={gasto.id} className={`${styles.gastoItem} ${styles[`persona${gasto.persona}`]}`}>
                {editandoId === gasto.id ? (
                  <div className={styles.gastoEdit}>
                    <input
                      type="text"
                      value={gasto.concepto}
                      onChange={e => {
                        const gastosActualizados = gastos.map(g =>
                          g.id === gasto.id ? {...g, concepto: e.target.value} : g
                        );
                        setGastos(gastosActualizados);
                      }}
                    />
                    <input
                      type="number"
                      value={gasto.monto}
                      onChange={e => {
                        const gastosActualizados = gastos.map(g =>
                          g.id === gasto.id ? {...g, monto: parseFloat(e.target.value)} : g
                        );
                        setGastos(gastosActualizados);
                      }}
                    />
                    <select
                      value={gasto.persona}
                      onChange={e => {
                        const gastosActualizados = gastos.map(g =>
                          g.id === gasto.id ? {...g, persona: e.target.value as 'Facu' | 'Cande'} : g
                        );
                        setGastos(gastosActualizados);
                      }}
                    >
                      <option value="Facu">Facu</option>
                      <option value="Cande">Cande</option>
                    </select>
                    <div className={styles.editActions}>
                      <button onClick={() => editarGasto(gasto.id)}>
                        <Save size={16} />
                      </button>
                      <button onClick={() => setEditandoId(null)}>
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.gastoView}>
                    <User2 size={16} className={styles.personaIcon} />
                    <span className={styles.concepto}>{gasto.concepto}</span>
                    <span className={styles.monto}>
                        {gasto.moneda === 'USD' ? '$' : '$'}
                        {monedaActual === gasto.moneda ? 
                            new Intl.NumberFormat('es-AR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                            useGrouping: true,
                            }).format(gasto.monto) : 
                            (gasto.moneda === 'USD' ? 
                            new Intl.NumberFormat('es-AR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                                useGrouping: true,
                            }).format(gasto.monto * cotizacionDolar) : 
                            new Intl.NumberFormat('es-AR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                                useGrouping: true,
                            }).format(gasto.monto / cotizacionDolar)
                            )
                        }
                        {' '}{monedaActual}
                        </span>
                    <div className={styles.actions}>
                      <button onClick={() => setEditandoId(gasto.id)}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => eliminarGasto(gasto.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TotalGastos;