"use strict";

var inputFile = document.getElementById("xls");
var reader;
var workbook;
var wsnames;
var first_ws;
var result;
var tabTSA, tabDT;
var myBoxplot, myChartDT, listVariables;
var indiceAge;
var output = document.getElementById("result");
var divVisageSelect = document.getElementById("divVisageSelect");
let myChartParam; // Declare the chart variable globally for canvasParam

// Variables globales pour les graphiques
let chartPValues, chartEcarts;

function previewXLSFile(e) {
  var file = e.target.files[0];
  reader = new FileReader();
  reader.onload = function (e) {
    var data = e.target.result;
    var workbook = XLSX.read(data, { type: "array" });
    var firstSheet = workbook.Sheets[workbook.SheetNames[0]];

    // header: 1 instructs xlsx to create an 'array of arrays'
    result = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

    //Traitement du fichier

    tabTSA = result.filter(function (f) {
      return f[result[1].indexOf("Case")] == "TSA";
    });
    tabDT = result.filter(function (f) {
      return f[result[1].indexOf("Case")] == "DT";
    });
    indiceAge = result[1].indexOf("Age (ans)");
    listVariables = result[1].filter((f) => {
      return f != "";
    });
    console.log(listVariables[4].split("_"));

    // exemple pour des boxplots
    var tabTestIndiceDT = recuperationValeursVariable(tabDT, 6);
    var tabTestIndiceTSA = recuperationValeursVariable(tabTSA, 6);

    remplirSelectsDynamique(result);
    remplirSelectAge(result);

    document.getElementById("zoneSelect").addEventListener("change", () => {
      construireVariableDepuisSelection();
    });
    document.getElementById("variableSelect").addEventListener("change", () => {
      construireVariableDepuisSelection();
    });
    document.getElementById("visageSelect").addEventListener("change", () => {
      construireVariableDepuisSelection();
    });
    document.getElementById("ageCategory").addEventListener("change", () => {
      construireVariableDepuisSelection();
    });

    // construction du jeu à afficher
    var boxplotTestData = {
      labels: ["global"],
      datasets: [
        {
          label: "DT",
          backgroundColor: "rgba(255,0,0,0.5)",
          borderColor: "red",
          borderWidth: 1,
          outlierColor: "#999999",
          padding: 10,
          itemRadius: 0,
          data: [tabTestIndiceDT],
        },
        {
          label: "TSA",
          backgroundColor: "rgba(0,0,255,0.5)",
          borderColor: "blue",
          borderWidth: 1,
          outlierColor: "#999999",
          padding: 10,
          itemRadius: 0,
          data: [tabTestIndiceTSA],
        },
      ],
    };

    const ctx = document.getElementById("canvas").getContext("2d");
    myBoxplot = new Chart(ctx, {
      type: "boxplot",
      data: boxplotTestData,
      options: {
        responsive: true,
        legend: {
          position: "bottom",
        },
        title: {
          display: true,
          text: "Boxplot de " + result[1][6] + " par cat age",
        },
      },
    });

    // exemple de graph ligne
    const deuxVarTab = recuperationValeursDeuxVariables(tabDT, indiceAge, 6);
    var tabDTTestIndiceAge = deuxVarTab[0];
    var tabDTTestIndiceValues = deuxVarTab[1];

    // Détruire le graphique existant
    if (myChartDT) {
      myChartDT.destroy();
    }

    const ctxDT = document.getElementById("canvasDT").getContext("2d");
    myChartDT = new Chart(ctxDT, {
      type: "line",
      data: {
        labels: tabDTTestIndiceAge,
        datasets: [
          {
            label: "DT",
            backgroundColor: "rgba(255,0,0,1.0)",
            borderColor: "rgba(255,0,0,0.1)",
            data: tabDTTestIndiceValues,
          },
        ],
      },
    });
  };
  reader.readAsArrayBuffer(file); // console.log(ss.min(tabTestIndiceTSA));
}
// fonction qui renvoie les valeurs d'une colonne donnée d'indice (indice) dans un tableau 2D (tab) avec élimination des valeurs vides
function recuperationValeursVariable(tab, indice) {
  var tabResult = [];
  tab.forEach((ligne) => {
    if (
      ligne[indice] != null &&
      ligne[indice] != 1000 &&
      ligne[indice] != "" &&
      ligne[indice] != 0 &&
      ligne[indice] != undefined
    ) {
      tabResult.push(ligne[indice]);
    }
  });
  return tabResult;
}
// fonction qui renvoie un tableau de deux colonnes contenant les valeurs de deux colonnes données d'indices (indice1, indice2) dans un tableau 2D (tab)
function recuperationValeursDeuxVariables(tab, indice1, indice2) {
  var tabResult1 = [];
  var tabResult2 = [];
  tab.forEach((ligne) => {
    var condIndice1 =
      ligne[indice1] != null &&
      ligne[indice1] != 1000 &&
      ligne[indice1] != "" &&
      ligne[indice1] != 0 &&
      ligne[indice1] != undefined;
    var condIndice2 =
      ligne[indice2] != null &&
      ligne[indice2] != 1000 &&
      ligne[indice2] != "" &&
      ligne[indice2] != 0 &&
      ligne[indice2] != undefined;
    if (condIndice1 && condIndice2) {
      tabResult1.push(ligne[indice1]);
      tabResult2.push(ligne[indice2]);
    }
  });
  return [tabResult1, tabResult2];
}

// fonction qui retourne la valeur d'un nombre x avec une précision de 6
function precise(x) {
  return x.toPrecision(6);
}

// fonction qui retourne vrai si la valeur de la ligne à l'indice (indiceAge) est comprise entre minAge et maxAge
function testCatAge(ligne, indiceAge, minAge, maxAge) {
  return (
    Math.floor(ligne[indiceAge]) >= minAge &&
    Math.floor(ligne[indiceAge]) <= maxAge
  );
}

// fonction qui renvoie un élement HTML correspondant à un tableau 2D avec entête
function creationTableauHTML2D(tab) {
  var retour = document.createElement("table");
  for (var i in tab) {
    var tr = document.createElement("tr");
    for (var j of tab[i]) {
      var td =
        i == 0 ? document.createElement("th") : document.createElement("td");
      td.textContent = j;
      tr.appendChild(td);
    }
    retour.appendChild(tr);
  }
  return retour;
}

//fonction qui renvoie la valeur de la p-value d'un t-test pour deux tableaux 1D en entrée
function ttestpvalue(array1, array2) {
  if (!array1 || !array2 || array1.length === 0 || array2.length === 0) {
    return NaN;
  }

  try {
    var mean1 = ss.mean(array1);
    var mean2 = ss.mean(array2);
    var tTest2 = Math.abs(
      (mean1 - mean2) /
        Math.sqrt(
          ss.variance(array1) / array1.length +
            ss.variance(array2) / array2.length
        )
    );
    var degFre =
      Math.pow(
        ss.variance(array1) / array1.length +
          ss.variance(array2) / array2.length,
        2
      ) /
      (Math.pow(ss.variance(array1) / array1.length, 2) / (array1.length - 1) +
        Math.pow(ss.variance(array2) / array2.length, 2) / (array2.length - 1));
    var p_value = 1 - jStat.studentt.cdf(tTest2, Math.abs(degFre));
    return p_value;
  } catch (error) {
    console.warn("Erreur dans le calcul de p-value:", error);
    return NaN;
  }
}

// Fonction pour remplir les sélecteurs dynamiquement
function remplirSelectsDynamique() {
  // 1. Remplir zoneSelect
  const zones = ["Tete", "Yeux", "Bouche", "Ecran"];
  remplirSelect("zoneSelect", zones);

  // 2. Remplir variableSelect
  const variables = ["TTT", "TF", "TP", "NBF", "NBEZ", "Lat"];
  remplirSelect("variableSelect", variables);

  // 3. Remplir visageSelect
  const visages = Array.from({ length: 4 }, (_, i) => `Visage${i + 1}`);
  remplirSelect("visageSelect", visages);
}

// Fonction générique pour remplir un select HTML
function remplirSelect(selectId, values) {
  const selectElement = document.getElementById(selectId);
  selectElement.innerHTML = "";

  if (values.length === 0) {
    console.warn(`Aucune valeur trouvée pour le sélecteur ${selectId}.`);
    return;
  }
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    selectElement.appendChild(option);
  });
}

// Fonction pour remplir le sélecteur d'âge
function remplirSelectAge(data) {
  const ageSelect = document.getElementById("ageCategory");
  ageSelect.innerHTML = "";

  const ages = recuperationValeursVariable(data, indiceAge)
    .map((age) => parseInt(age))
    .filter((age) => !isNaN(age));

  const minAge = Math.min(...ages);
  const maxAge = Math.max(...ages);

  for (let age = minAge + 1; age <= maxAge - 1; age++) {
    const option = document.createElement("option");
    option.value = age;
    option.textContent = age;
    ageSelect.appendChild(option);
  }
}

// Fonction pour construire l'objet/variable basé sur les sélections
function construireVariableDepuisSelection() {
  const zone = document.getElementById("zoneSelect").value;
  const variable = document.getElementById("variableSelect").value;
  const visage = document.getElementById("visageSelect").value;
  const ageCategory = parseInt(document.getElementById("ageCategory").value);

  const variableConstruite = {
    zone: zone,
    variable: variable,
    visage: visage,
    ageCategory: ageCategory,
  };

  return variableConstruite;
}

inputFile.addEventListener("change", previewXLSFile, false);
document
  .getElementById("zoneSelect")
  .addEventListener("change", afficheDataVis);
document
  .getElementById("variableSelect")
  .addEventListener("change", afficheDataVis);
document
  .getElementById("visageSelect")
  .addEventListener("change", afficheDataVis);
document
  .getElementById("ageCategory")
  .addEventListener("change", afficheDataVis);

// Fonction pour afficher les données visuelles
function afficheDataVis() {
  const zone = document.getElementById("zoneSelect").value;
  const variable = document.getElementById("variableSelect").value;
  const visageSelect = document.getElementById("visageSelect").value;
  const ageCategory = parseInt(document.getElementById("ageCategory").value);
  const allVariables = Array.from(
    document.getElementById("variableSelect").options
  );
  const variableName =
    variable === "TTT"
      ? `${variable}_${visageSelect}`
      : `${variable}_${zone}_${visageSelect}`;
  const indVarSel = listVariables.indexOf(variableName);

  if (indVarSel === -1) {
    console.error(`Variable ${variableName} non trouvée dans les données`);
    return;
  }

  const catAgeData = {
    tabDTCatAge1: tabDT.filter((ligne) =>
      testCatAge(ligne, indiceAge, 0, ageCategory)
    ),
    tabDTCatAge2: tabDT.filter((ligne) =>
      testCatAge(ligne, indiceAge, ageCategory + 1, 100)
    ),
    tabTSACatAge1: tabTSA.filter((ligne) =>
      testCatAge(ligne, indiceAge, 0, ageCategory)
    ),
    tabTSACatAge2: tabTSA.filter((ligne) =>
      testCatAge(ligne, indiceAge, ageCategory + 1, 100)
    ),
  };

  const visageNumber = parseInt(visageSelect.substr(6));
  document.getElementById("visage").style.background =
    "url('./assets/img/visages/visage" + visageNumber + ".jpg')";
  var pictozonevar = document.getElementById("pictozonevar");
  pictozonevar.src =
    variable === "TTT"
      ? "./assets/picto/SVG/" + variable + ".svg"
      : "./assets/picto/SVG/" + variable + zone + ".svg";

  var tabDTVarSel = recuperationValeursVariable(tabDT, indVarSel);
  var tabTSAVarSel = recuperationValeursVariable(tabTSA, indVarSel);

  const boxplotData = {
    labels: ["DT", "TSA", "DT Cat1", "DT Cat2", "TSA Cat1", "TSA Cat2"],
    datasets: [
      {
        label: variable,
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
        outlierColor: "#999999",
        padding: 10,
        itemRadius: 0,
        data: [
          tabDTVarSel,
          tabTSAVarSel,
          recuperationValeursVariable(catAgeData.tabDTCatAge1, indVarSel),
          recuperationValeursVariable(catAgeData.tabDTCatAge2, indVarSel),
          recuperationValeursVariable(catAgeData.tabTSACatAge1, indVarSel),
          recuperationValeursVariable(catAgeData.tabTSACatAge2, indVarSel),
        ],
      },
    ],
  };

  const ctxParam = document.getElementById("canvasParam").getContext("2d");
  if (myChartParam) {
    myChartParam.destroy();
  }
  myChartParam = new Chart(ctxParam, {
    type: "boxplot",
    data: boxplotData,
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        title: {
          display: true,
          text: "Distribution par groupe et catégorie d'âge",
        },
      },
    },
  });

  const statsTable = calculerStatistiques(
    [tabDTVarSel, tabTSAVarSel],
    ["DT", "TSA"]
  );
  document.getElementById("parameterContainer").innerHTML = "";
  document
    .getElementById("parameterContainer")
    .appendChild(creationTableauHTML2D(statsTable));

  const globalStats = calculerStatistiquesGlobales(
    allVariables,
    zone,
    visageSelect,
    catAgeData
  );
  afficherGraphiquePValues(globalStats);
  afficherGraphiqueEcarts(globalStats);
  afficherTableauxStatistiques(globalStats, zone, visageSelect);
}

// Fonction pour calculer les statistiques globales pour toutes les variables
function calculerStatistiquesGlobales(
  variables,
  zone,
  visageSelect,
  catAgeData
) {
  const { tabDTCatAge1, tabDTCatAge2, tabTSACatAge1, tabTSACatAge2 } =
    catAgeData;

  const globalStats = {
    variables: [],
    pValues: [],
    ecarts: [],
    pValuesCatAge: { cat1: [], cat2: [] },
    ecartsCatAge: { cat1: [], cat2: [] },
  };

  for (let opt of variables) {
    const varName =
      opt.value === "TTT"
        ? `${opt.value}_${visageSelect}`
        : `${opt.value}_${zone}_${visageSelect}`;

    const varIndex = listVariables.indexOf(varName);

    if (varIndex === -1) {
      console.warn(`Variable ${varName} non trouvée`);
      continue;
    }

    const dtValues = recuperationValeursVariable(tabDT, varIndex);
    const tsaValues = recuperationValeursVariable(tabTSA, varIndex);

    globalStats.variables.push(opt.value);
    const pValue = ttestpvalue(dtValues, tsaValues);
    globalStats.pValues.push(isNaN(pValue) ? null : pValue);

    const dtMean = dtValues.length > 0 ? ss.mean(dtValues) : 0;
    const tsaMean = tsaValues.length > 0 ? ss.mean(tsaValues) : 0;
    globalStats.ecarts.push(Math.abs(dtMean - tsaMean));

    const dtCat1Values = recuperationValeursVariable(tabDTCatAge1, varIndex);
    const tsaCat1Values = recuperationValeursVariable(tabTSACatAge1, varIndex);
    const dtCat2Values = recuperationValeursVariable(tabDTCatAge2, varIndex);
    const tsaCat2Values = recuperationValeursVariable(tabTSACatAge2, varIndex);

    const pValueCat1 = ttestpvalue(dtCat1Values, tsaCat1Values);
    const pValueCat2 = ttestpvalue(dtCat2Values, tsaCat2Values);
    globalStats.pValuesCatAge.cat1.push(isNaN(pValueCat1) ? null : pValueCat1);
    globalStats.pValuesCatAge.cat2.push(isNaN(pValueCat2) ? null : pValueCat2);

    const dtCat1Mean = dtCat1Values.length > 0 ? ss.mean(dtCat1Values) : 0;
    const tsaCat1Mean = tsaCat1Values.length > 0 ? ss.mean(tsaCat1Values) : 0;
    const dtCat2Mean = dtCat2Values.length > 0 ? ss.mean(dtCat2Values) : 0;
    const tsaCat2Mean = tsaCat2Values.length > 0 ? ss.mean(tsaCat2Values) : 0;

    globalStats.ecartsCatAge.cat1.push(Math.abs(dtCat1Mean - tsaCat1Mean));
    globalStats.ecartsCatAge.cat2.push(Math.abs(dtCat2Mean - tsaCat2Mean));
  }

  return globalStats;
}

// Fonction pour afficher le graphique des p-values
function afficherGraphiquePValues(globalStats) {
  const ctxPValues = document
    .getElementById("canvasPValuesCatAge1")
    .getContext("2d");
  const filteredData = globalStats.variables
    .map((variable, index) => ({
      variable: variable,
      pValueGlobal: globalStats.pValues[index],
      pValueCat1: globalStats.pValuesCatAge.cat1[index],
      pValueCat2: globalStats.pValuesCatAge.cat2[index],
    }))
    .filter((d) => d.pValueGlobal !== null && !isNaN(d.pValueGlobal));

  if (chartPValues) {
    chartPValues.destroy();
  }

  chartPValues = new Chart(ctxPValues, {
    type: "bar",
    data: {
      labels: filteredData.map((d) => d.variable),
      datasets: [
        {
          label: "P-values globales",
          data: filteredData.map((d) => d.pValueGlobal),
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
        {
          label: "P-values Cat. Age 1",
          data: filteredData.map((d) => d.pValueCat1),
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
        },
        {
          label: "P-values Cat. Age 2",
          data: filteredData.map((d) => d.pValueCat2),
          backgroundColor: "rgba(75, 192, 192, 0.5)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "P-values par variable et catégorie d'âge",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 1,
        },
      },
    },
  });
}

// Fonction pour afficher le graphique des écarts
function afficherGraphiqueEcarts(globalStats) {
  const ctxEcarts = document
    .getElementById("canvasEcartsCatAge1")
    .getContext("2d");
  const filteredEcarts = globalStats.variables
    .map((variable, index) => ({
      variable: variable,
      ecartGlobal: globalStats.ecarts[index],
      ecartCat1: globalStats.ecartsCatAge.cat1[index],
      ecartCat2: globalStats.ecartsCatAge.cat2[index],
    }))
    .filter((d) => d.ecartGlobal !== null && !isNaN(d.ecartGlobal));

  if (chartEcarts) {
    chartEcarts.destroy();
  }

  chartEcarts = new Chart(ctxEcarts, {
    type: "bar",
    data: {
      labels: filteredEcarts.map((d) => d.variable),
      datasets: [
        {
          label: "Écarts globaux",
          data: filteredEcarts.map((d) => d.ecartGlobal),
          backgroundColor: "rgba(153, 102, 255, 0.5)",
          borderColor: "rgba(153, 102, 255, 1)",
          borderWidth: 1,
        },
        {
          label: "Écarts Cat. Age 1",
          data: filteredEcarts.map((d) => d.ecartCat1),
          backgroundColor: "rgba(255, 159, 64, 0.5)",
          borderColor: "rgba(255, 159, 64, 1)",
          borderWidth: 1,
        },
        {
          label: "Écarts Cat. Age 2",
          data: filteredEcarts.map((d) => d.ecartCat2),
          backgroundColor: "rgba(255, 205, 86, 0.5)",
          borderColor: "rgba(255, 205, 86, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Écarts entre groupes par variable et catégorie d'âge",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

// Fonction pour afficher les tableaux statistiques
function afficherTableauxStatistiques(globalStats, zone, visageSelect) {
  const globalStatsTable = [
    ["Variable", "Moyenne DT", "Moyenne TSA", "Écart", "P-value"],
    ...globalStats.variables.map((variable, index) => {
      const varName =
        variable === "TTT"
          ? `${variable}_${visageSelect}`
          : `${variable}_${zone}_${visageSelect}`;
      const varIndex = listVariables.indexOf(varName);
      const dtValues = recuperationValeursVariable(tabDT, varIndex);
      const tsaValues = recuperationValeursVariable(tabTSA, varIndex);
      const dtMean = dtValues.length > 0 ? ss.mean(dtValues).toFixed(2) : "N/A";
      const tsaMean =
        tsaValues.length > 0 ? ss.mean(tsaValues).toFixed(2) : "N/A";
      const ecart =
        dtValues.length > 0 && tsaValues.length > 0
          ? globalStats.ecarts[index].toFixed(2)
          : "N/A";
      const pValue = globalStats.pValues[index]
        ? globalStats.pValues[index].toFixed(4)
        : "N/A";

      return [variable, dtMean, tsaMean, ecart, pValue];
    }),
  ];

  const globalStatsContainer = document.getElementById("globalStatsContainer");
  globalStatsContainer.innerHTML = "<h4>Statistiques globales</h4>";
  globalStatsContainer.appendChild(creationTableauHTML2D(globalStatsTable));
}

// Fonction pour calculer les statistiques de base pour un ensemble de données
function calculerStatistiques(datasets, labels) {
  const stats = [["Population", "Moyenne", "Écart-type", "Min", "Max", "N"]];
  datasets.forEach((data, index) => {
    if (data && data.length > 0) {
      try {
        stats.push([
          labels[index],
          ss.mean(data).toFixed(2),
          ss.standardDeviation(data).toFixed(2),
          Math.min(...data).toFixed(2),
          Math.max(...data).toFixed(2),
          data.length,
        ]);
      } catch (error) {
        console.warn(`Erreur de calcul pour ${labels[index]}:`, error);
        stats.push([labels[index], "N/A", "N/A", "N/A", "N/A", data.length]);
      }
    } else {
      stats.push([labels[index], "N/A", "N/A", "N/A", "N/A", 0]);
    }
  });

  return stats;
}
