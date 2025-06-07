import React, { useState, useEffect } from 'react';

// Main App Component
const App = () => {
  // State for CLT inputs
  const [cltGrossSalary, setCltGrossSalary] = useState('') ;
  const [cltDependents, setCltDependents] = useState(0);
  const [cltTransportePercent, setCltTransportePercent] = useState(6); // Default 6% of gross, employee share
  const [cltRefeicaoValue, setCltRefeicaoValue] = useState(0);
  const [cltHealthPlanValue, setCltHealthPlanValue] = useState(0); // Health Plan value
  const [cltDentalPlanValue, setCltDentalPlanValue] = useState(0); // Dental Plan value
  const [cltOtherBenefitsValue, setCltOtherBenefitsValue] = useState(0); // Other Benefits value

  // State for calculated CLT deductions/benefits
  const [cltInssDeduction, setCltInssDeduction] = useState(0);
  const [cltIrrfDeduction, setCltIrrfDeduction] = useState(0);
  const [cltFgtsEmployerCost, setCltFgtsEmployerCost] = useState(0); // FGTS as employer cost

  // State for PJ inputs
  const [pjGrossInvoice, setPjGrossInvoice] = useState('');
  const [pjSimplesNacionalPercent, setPjSimplesNacionalPercent] = useState(6); // Default 6% for Simples Nacional
  const [pjAccountantFee, setPjAccountantFee] = useState(300); // Default accountant fee
  const [pjProLaborePercent, setPjProLaborePercent] = useState(30); // Default 30% of gross invoice as pro-labore

  // State for calculated PJ deductions
  const [pjSimplesNacionalTax, setPjSimplesNacionalTax] = useState(0);
  const [pjProLaboreInss, setPjProLaboreInss] = useState(0);
  const [pjProLaboreIrrf, setPjProLaboreIrrf] = useState(0);

  // State for calculated results
  const [cltNetCashIncome, setCltNetCashIncome] = useState(0); // Renamed for clarity: cash income
  const [cltTotalCompensation, setCltTotalCompensation] = useState(0); // Total compensation including benefits and FGTS
  const [pjNetIncome, setPjNetIncome] = useState(0);

  // Constants for tax calculations (based on 2024 values, simplified)
  // INSS Progressive Table (Employee Contribution)
  const INSS_TABLE = [
    { limit: 1412.00, rate: 0.075, deduction: 0 },
    { limit: 2666.68, rate: 0.09, deduction: 21.18 },
    { limit: 4000.03, rate: 0.12, deduction: 101.18 },
    { limit: 7786.02, rate: 0.14, deduction: 181.18 },
  ];
  const INSS_MAX_CEILING = 7786.02; // Max salary for INSS contribution
  const INSS_MAX_DEDUCTION = 1089.94; // Max INSS deduction (14% of 7786.02)

  // IRRF Progressive Table
  const IRRF_TABLE = [
    { limit: 2259.20, rate: 0, deduction: 0 },
    { limit: 2826.65, rate: 0.075, deduction: 169.44 },
    { limit: 3751.05, rate: 0.15, deduction: 381.44 },
    { limit: 4664.68, rate: 0.225, deduction: 662.77 },
    { limit: Infinity, rate: 0.275, deduction: 896.00 },
  ];
  const IRRF_DEDUCTION_PER_DEPENDENT = 189.59; // Per dependent deduction for IRRF

  const FGTS_RATE = 0.08; // 8% of gross salary for FGTS

  // Helper function to calculate INSS
  const calculateINSS = (gross: number) => {
    let inss = 0;
    if (gross <= 0) return 0;

    // Apply progressive rates correctly
    if (gross <= INSS_TABLE[0].limit) {
      inss = gross * INSS_TABLE[0].rate;
    } else if (gross <= INSS_TABLE[1].limit) {
      inss = (INSS_TABLE[0].limit * INSS_TABLE[0].rate) + ((gross - INSS_TABLE[0].limit) * INSS_TABLE[1].rate);
    } else if (gross <= INSS_TABLE[2].limit) {
      inss = (INSS_TABLE[0].limit * INSS_TABLE[0].rate) +
             ((INSS_TABLE[1].limit - INSS_TABLE[0].limit) * INSS_TABLE[1].rate) +
             ((gross - INSS_TABLE[1].limit) * INSS_TABLE[2].rate);
    } else if (gross <= INSS_TABLE[3].limit) { // Up to max ceiling
      inss = (INSS_TABLE[0].limit * INSS_TABLE[0].rate) +
             ((INSS_TABLE[1].limit - INSS_TABLE[0].limit) * INSS_TABLE[1].rate) +
             ((INSS_TABLE[2].limit - INSS_TABLE[1].limit) * INSS_TABLE[2].rate) +
             ((gross - INSS_TABLE[2].limit) * INSS_TABLE[3].rate);
    } else { // Above max ceiling
      inss = INSS_MAX_DEDUCTION;
    }
    return Math.min(inss, INSS_MAX_DEDUCTION); // Ensure it doesn't exceed the max deduction
  };

  // Helper function to calculate IRRF
  const calculateIRRF = (base: number) => {
    let irrf = 0;
    if (base <= 0) return 0;

    for (const band of IRRF_TABLE) {
      if (base <= band.limit) {
        irrf = base * band.rate - band.deduction;
        break;
      }
    }
    return Math.max(0, irrf); // Ensure IRRF is not negative
  };

  // Effect to recalculate CLT net income and total compensation whenever inputs change
  useEffect(() => {
    const gross = parseFloat(cltGrossSalary) || 0;
    const dependents = cltDependents || 0;
    const transportePercent = cltTransportePercent || 0;
    const refeicaoValue = cltRefeicaoValue || 0;
    const healthPlan = cltHealthPlanValue || 0;
    const dentalPlan = cltDentalPlanValue || 0;
    const otherBenefits = cltOtherBenefitsValue || 0;

    // CLT INSS calculation
    const inss = calculateINSS(gross);
    setCltInssDeduction(inss);

    // CLT IRRF calculation
    const irrfBase = gross - inss - (dependents * IRRF_DEDUCTION_PER_DEPENDENT);
    const irrf = calculateIRRF(irrfBase);
    setCltIrrfDeduction(irrf);

    // Vale Transporte (employee share, capped at 6% of gross)
    const valeTransporteDeduction = Math.min(gross * (transportePercent / 100), gross * 0.06); // Assuming 6% is max deduction

    // FGTS (employer cost)
    const fgts = gross * FGTS_RATE;
    setCltFgtsEmployerCost(fgts);

    // Cash Net Income (what's deposited in the bank)
    const cashNet = gross - inss - irrf - valeTransporteDeduction + refeicaoValue;
    setCltNetCashIncome(cashNet);

    // Total Compensation (including value of non-cash benefits provided by employer + FGTS)
    // FGTS is an employer cost, but represents a benefit to the employee (savings account)
    const totalComp = cashNet + healthPlan + dentalPlan + otherBenefits + fgts;
    setCltTotalCompensation(totalComp);

  }, [cltGrossSalary, cltDependents, cltTransportePercent, cltRefeicaoValue, cltHealthPlanValue, cltDentalPlanValue, cltOtherBenefitsValue]);

  // Effect to recalculate PJ net income whenever inputs change
  useEffect(() => {
    const grossInvoice = parseFloat(pjGrossInvoice) || 0;
    const simplesNacionalPercent = pjSimplesNacionalPercent || 0;
    const accountantFee = pjAccountantFee || 0;
    const proLaborePercent = pjProLaborePercent || 0;

    // PJ Simples Nacional
    const simplesNacional = grossInvoice * (simplesNacionalPercent / 100);
    setPjSimplesNacionalTax(simplesNacional);

    // PJ Pro-Labore calculation
    const proLaboreValue = grossInvoice * (proLaborePercent / 100);

    // Pro-Labore INSS (11% on pro-labore, capped at INSS_MAX_DEDUCTION on the pro-labore value)
    const proLaboreINSS = Math.min(proLaboreValue * 0.11, INSS_MAX_DEDUCTION);
    setPjProLaboreInss(proLaboreINSS);

    // Pro-Labore IRRF
    const proLaboreIRRFBase = proLaboreValue - proLaboreINSS;
    const proLaboreIRRF = calculateIRRF(proLaboreIRRFBase);
    setPjProLaboreIrrf(proLaboreIRRF);

    const net = grossInvoice - simplesNacional - accountantFee - proLaboreINSS - proLaboreIRRF;
    setPjNetIncome(net);
  }, [pjGrossInvoice, pjSimplesNacionalPercent, pjAccountantFee, pjProLaborePercent]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 font-inter text-gray-800 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="max-w-4xl w-full mx-auto bg-white shadow-xl rounded-2xl p-6 sm:p-8 lg:p-10 transform transition-all duration-300 hover:shadow-2xl">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-blue-700 mb-6 sm:mb-8 tracking-tight">
          📊 Calculadora de Salários CLT x PJ
        </h1>
        <p className="text-center text-gray-600 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
          Compare sua renda líquida estimada entre os regimes CLT e PJ, considerando as principais deduções, impostos e benefícios.
          <br/>
          <span className="font-semibold text-sm text-red-600 bg-red-50 p-2 rounded-md inline-block mt-2 shadow-sm">
            Atenção: Os cálculos são simplificados e valores como INSS e IRRF utilizam tabelas de 2024. Consulte um contador para dados exatos.
          </span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* CLT Section */}
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 shadow-md transform transition-transform duration-200 hover:scale-[1.01]">
            <h2 className="text-2xl font-bold text-blue-600 mb-4 flex items-center">
              💼 Regime CLT
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="cltGross" className="block text-sm font-medium text-gray-700">
                  Salário Bruto Mensal (R$)
                </label>
                <input
                  type="number"
                  id="cltGross"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
                  value={cltGrossSalary}
                  onChange={(e) => setCltGrossSalary(e.target.value)}
                  placeholder="Ex: 5000"
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="cltDependents" className="block text-sm font-medium text-gray-700">
                  Número de Dependentes
                </label>
                <input
                  type="number"
                  id="cltDependents"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
                  value={cltDependents}
                  onChange={(e) => setCltDependents(Number(e.target.value))}
                  placeholder="Ex: 1"
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="cltTransporte" className="block text-sm font-medium text-gray-700">
                  Vale Transporte (%) do salário bruto (pago pelo funcionário, máx 6%)
                </label>
                <input
                  type="number"
                  id="cltTransporte"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
                  value={cltTransportePercent}
                  onChange={(e) => setCltTransportePercent(Number(e.target.value))}
                  placeholder="Ex: 6"
                  min="0"
                  max="6" // Max 6% for employee share
                />
              </div>
              <div>
                <label htmlFor="cltRefeicao" className="block text-sm font-medium text-gray-700">
                  Vale Refeição/Alimentação (R$) (valor fixo mensal)
                </label>
                <input
                  type="number"
                  id="cltRefeicao"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
                  value={cltRefeicaoValue}
                  onChange={(e) => setCltRefeicaoValue(Number(e.target.value))}
                  placeholder="Ex: 800"
                  min="0"
                />
              </div>
              {/* Display CLT Tax Deductions */}
              <div className="mt-4 bg-blue-100 p-4 rounded-lg shadow-inner">
                <h3 className="text-lg font-semibold text-blue-700 mb-2">Impostos e Deduções CLT (Mensal)</h3>
                <p className="text-base text-gray-700">INSS: <span className="font-semibold text-blue-800">{cltInssDeduction.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                <p className="text-base text-gray-700">IRRF: <span className="font-semibold text-blue-800">{cltIrrfDeduction.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                <p className="text-base text-gray-700">FGTS (Custo Empregador): <span className="font-semibold text-blue-800">{cltFgtsEmployerCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-blue-600 mb-2">Benefícios (Valor do Empregador)</h3>
                <div>
                  <label htmlFor="cltHealthPlan" className="block text-sm font-medium text-gray-700">
                    Valor do Plano de Saúde (R$ mensal)
                  </label>
                  <input
                    type="number"
                    id="cltHealthPlan"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
                    value={cltHealthPlanValue}
                    onChange={(e) => setCltHealthPlanValue(Number(e.target.value))}
                    placeholder="Ex: 500"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="cltDentalPlan" className="block text-sm font-medium text-gray-700">
                    Valor do Plano Odontológico (R$ mensal)
                  </label>
                  <input
                    type="number"
                    id="cltDentalPlan"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
                    value={cltDentalPlanValue}
                    onChange={(e) => setCltDentalPlanValue(Number(e.target.value))}
                    placeholder="Ex: 100"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="cltOtherBenefits" className="block text-sm font-medium text-gray-700">
                    Outros Benefícios (R$ mensal)
                  </label>
                  <input
                    type="number"
                    id="cltOtherBenefits"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
                    value={cltOtherBenefitsValue}
                    onChange={(e) => setCltOtherBenefitsValue(Number(e.target.value))}
                    placeholder="Ex: 200"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PJ Section */}
          <div className="bg-purple-50 p-6 rounded-xl border border-purple-200 shadow-md transform transition-transform duration-200 hover:scale-[1.01]">
            <h2 className="text-2xl font-bold text-purple-600 mb-4 flex items-center">
               freelance Regime PJ
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="pjGross" className="block text-sm font-medium text-gray-700">
                  Valor da Fatura Bruta Mensal (R$)
                </label>
                <input
                  type="number"
                  id="pjGross"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all duration-200"
                  value={pjGrossInvoice}
                  onChange={(e) => setPjGrossInvoice(e.target.value)}
                  placeholder="Ex: 8000"
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="pjSimples" className="block text-sm font-medium text-gray-700">
                  Alíquota Simples Nacional (%)
                </label>
                <input
                  type="number"
                  id="pjSimples"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all duration-200"
                  value={pjSimplesNacionalPercent}
                  onChange={(e) => setPjSimplesNacionalPercent(Number(e.target.value))}
                  placeholder="Ex: 6"
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="pjAccountant" className="block text-sm font-medium text-gray-700">
                  Honorários do Contador (R$ fixo mensal)
                </label>
                <input
                  type="number"
                  id="pjAccountant"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all duration-200"
                  value={pjAccountantFee}
                  onChange={(e) => setPjAccountantFee(Number(e.target.value))}
                  placeholder="Ex: 300"
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="pjProLabore" className="block text-sm font-medium text-gray-700">
                  Percentual de Pró-Labore (%) da fatura bruta
                </label>
                <input
                  type="number"
                  id="pjProLabore"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all duration-200"
                  value={pjProLaborePercent}
                  onChange={(e) => setPjProLaborePercent(Number(e.target.value))}
                  placeholder="Ex: 30"
                  min="0"
                  max="100"
                />
              </div>
              {/* Display PJ Tax Deductions */}
              <div className="mt-4 bg-purple-100 p-4 rounded-lg shadow-inner">
                <h3 className="text-lg font-semibold text-purple-700 mb-2">Impostos e Deduções PJ (Mensal)</h3>
                <p className="text-base text-gray-700">Simples Nacional: <span className="font-semibold text-purple-800">{pjSimplesNacionalTax.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                <p className="text-base text-gray-700">INSS (Pró-labore): <span className="font-semibold text-purple-800">{pjProLaboreInss.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                <p className="text-base text-gray-700">IRRF (Pró-labore): <span className="font-semibold text-purple-800">{pjProLaboreIrrf.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                <p className="text-base text-gray-700">Honorários Contador: <span className="font-semibold text-purple-800">{pjAccountantFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="mt-8 pt-6 border-t-2 border-gray-200">
          <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">Resultados Comparativos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-blue-100 p-6 rounded-lg shadow-md text-center transform transition-transform duration-200 hover:scale-[1.02]">
              <h3 className="text-xl font-semibold text-blue-700 mb-2">Renda Líquida CLT (em Dinheiro)</h3>
              <p className="text-4xl font-extrabold text-blue-800">
                {cltNetCashIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                (Salário Bruto - Impostos - VT + VR/VA)
              </p>
            </div>
            <div className="bg-purple-100 p-6 rounded-lg shadow-md text-center transform transition-transform duration-200 hover:scale-[1.02]">
              <h3 className="text-xl font-semibold text-purple-700 mb-2">Renda Líquida PJ</h3>
              <p className="text-4xl font-extrabold text-purple-800">
                {pjNetIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                (Fatura Bruta - Impostos - Contador)
              </p>
            </div>
          </div>

          <div className="mt-8 text-center bg-blue-50 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-blue-700 mb-2">Valor Total da Remuneração CLT (incluindo benefícios e FGTS)</h3>
            <p className="text-4xl font-extrabold text-blue-800">
              {cltTotalCompensation.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              (Renda Líquida em Dinheiro + Plano de Saúde + Plano Odontológico + Outros Benefícios + FGTS)
            </p>
          </div>

          <div className="mt-8 text-center">
            {cltTotalCompensation > 0 && pjNetIncome > 0 && (
              <p className="text-lg font-bold text-gray-800">
                A diferença mensal na remuneração total é de{' '}
                <span className={`text-2xl font-extrabold ${pjNetIncome > cltTotalCompensation ? 'text-green-600' : 'text-red-600'}`}>
                  {(pjNetIncome - cltTotalCompensation).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                {pjNetIncome > cltTotalCompensation ? ' a mais no regime PJ (considerando os benefícios CLT e FGTS).' : ' a mais no regime CLT (considerando os benefícios e FGTS).'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
