import './style.css';

const storageKey = 'generate-passwords-state';
const defaultState = {
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    password: ''
};

const passwordOutput = document.querySelector('#password');
const statusMessage = document.querySelector('#status');
const strengthValue = document.querySelector('#strength-value');
const strengthFill = document.querySelector('#strength-fill');
const strengthHint = document.querySelector('#strength-hint');
const generateButton = document.querySelector('#generate');
const copyButton = document.querySelector('#copy');
const resetButton = document.querySelector('#reset');
const lengthInput = document.querySelector('#length');
const lengthValue = document.querySelector('#length-value');
const uppercaseInput = document.querySelector('#uppercase');
const lowercaseInput = document.querySelector('#lowercase');
const numbersInput = document.querySelector('#numbers');
const symbolsInput = document.querySelector('#symbols');

const characterSets = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{};:,.?/|'
};

const getStorage = () => {
    try {
        return window.localStorage;
    } catch {
        return null;
    }
};

const readState = () => {
    const storage = getStorage();

    if (!storage) {
        return { ...defaultState };
    }

    try {
        const rawState = storage.getItem(storageKey);

        if (!rawState) {
            return { ...defaultState };
        }

        const parsedState = JSON.parse(rawState);

        return {
            ...defaultState,
            ...parsedState
        };
    } catch {
        return { ...defaultState };
    }
};

const writeState = (partialState) => {
    const storage = getStorage();

    if (!storage) {
        return;
    }

    const currentState = readState();
    const nextState = {
        ...currentState,
        ...partialState
    };

    try {
        storage.setItem(storageKey, JSON.stringify(nextState));
    } catch {
        // Ignore storage failures, the generator still works without persistence.
    }
};

const clearState = () => {
    const storage = getStorage();

    if (!storage) {
        return;
    }

    try {
        storage.removeItem(storageKey);
    } catch {
        // Ignore storage failures, the generator still works without persistence.
    }
};

const randomIndex = (max) => {
    if (window.crypto?.getRandomValues) {
        const array = new Uint32Array(1);
        const limit = Math.floor(0x100000000 / max) * max;
        let value = 0;

        do {
            window.crypto.getRandomValues(array);
            value = array[0];
        } while (value >= limit);

        return value % max;
    }

    return Math.floor(Math.random() * max);
};

const pickCharacter = (characters) => characters[randomIndex(characters.length)];

const shuffle = (characters) => {
    for (let index = characters.length - 1; index > 0; index -= 1) {
        const swapIndex = randomIndex(index + 1);
        [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
    }

    return characters;
};

const getSelectedSets = () => {
    const selectedSets = [];

    if (uppercaseInput.checked) selectedSets.push(characterSets.uppercase);
    if (lowercaseInput.checked) selectedSets.push(characterSets.lowercase);
    if (numbersInput.checked) selectedSets.push(characterSets.numbers);
    if (symbolsInput.checked) selectedSets.push(characterSets.symbols);

    return selectedSets;
};

const updateLengthLabel = () => {
    lengthValue.textContent = `${lengthInput.value} caracteres`;
};

const applyStateToControls = (state) => {
    lengthInput.value = String(state.length);
    uppercaseInput.checked = state.uppercase;
    lowercaseInput.checked = state.lowercase;
    numbersInput.checked = state.numbers;
    symbolsInput.checked = state.symbols;
};

const getStrengthInfo = (password, selectedSets) => {
    const length = password.length;
    const diversity = selectedSets.length;
    const lengthScore = length >= 20 ? 3 : length >= 16 ? 2 : length >= 12 ? 1 : 0;
    const score = diversity + lengthScore;

    if (diversity === 0) {
        return {
            label: 'Fraca',
            percentage: 0,
            hint: 'Ative pelo menos um tipo de caractere para gerar a senha.'
        };
    }

    if (score >= 6) {
        return {
            label: 'Forte',
            percentage: 100,
            hint: 'Boa combinação de tamanho e variedade. Essa é a faixa ideal.'
        };
    }

    if (score >= 4) {
        return {
            label: 'Boa',
            percentage: 66,
            hint: 'Para melhorar, aumente o tamanho ou ative mais categorias.'
        };
    }

    return {
        label: 'Fraca',
        percentage: 34,
        hint: 'Use 12+ caracteres e combine letras, números e símbolos.'
    };
};

const generatePassword = () => {
    const length = Number(lengthInput.value);
    const selectedSets = getSelectedSets();

    if (selectedSets.length === 0) {
        return '';
    }

    const requiredCharacters = selectedSets.map((set) => pickCharacter(set));
    const pool = selectedSets.join('');
    const remainingLength = Math.max(length - requiredCharacters.length, 0);
    const remainingCharacters = Array.from({ length: remainingLength }, () => pickCharacter(pool));

    return shuffle([...requiredCharacters, ...remainingCharacters]).join('');
};

const showStatus = (message) => {
    statusMessage.textContent = message;
};

const updateStrengthMeter = (password, selectedSets) => {
    const strengthInfo = getStrengthInfo(password, selectedSets);

    strengthValue.textContent = strengthInfo.label;
    strengthFill.style.width = `${strengthInfo.percentage}%`;
    strengthFill.dataset.level = strengthInfo.label.toLowerCase();
    strengthHint.textContent = strengthInfo.hint;
};

const refreshPassword = () => {
    const password = generatePassword();
    const selectedSets = getSelectedSets();

    if (!password) {
        passwordOutput.textContent = 'Selecione ao menos um tipo de caractere.';
        showStatus('Ative pelo menos uma opção para gerar a senha.');
        updateStrengthMeter('', selectedSets);
        return;
    }

    passwordOutput.textContent = password;
    updateStrengthMeter(password, selectedSets);
    showStatus(`Senha gerada com nível ${strengthValue.textContent}.`);
    writeState({
        password,
        length: Number(lengthInput.value),
        uppercase: uppercaseInput.checked,
        lowercase: lowercaseInput.checked,
        numbers: numbersInput.checked,
        symbols: symbolsInput.checked
    });
};

const copyPassword = async () => {
    const password = passwordOutput.textContent?.trim();

    if (!password || password === 'Clique em gerar senha' || password === 'Selecione ao menos um tipo de caractere.') {
        showStatus('Gere uma senha antes de copiar.');
        return;
    }

    try {
        await navigator.clipboard.writeText(password);
        showStatus('Senha copiada para a área de transferência.');
    } catch {
        showStatus('Não foi possível copiar automaticamente.');
    }
};

const restoreState = () => {
    const savedState = readState();

    applyStateToControls(savedState);
    updateLengthLabel();

    if (savedState.password) {
        passwordOutput.textContent = savedState.password;
        updateStrengthMeter(savedState.password, getSelectedSets());
        showStatus('Última senha e preferências restauradas.');
        return;
    }

    refreshPassword();
};

const resetPreferences = () => {
    clearState();
    applyStateToControls(defaultState);
    updateLengthLabel();
    passwordOutput.textContent = 'Clique em gerar senha';
    updateStrengthMeter('', []);
    showStatus('Preferências restauradas. Gere uma nova senha para começar.');
};

lengthInput.addEventListener('input', () => {
    updateLengthLabel();
    refreshPassword();
});

generateButton.addEventListener('click', refreshPassword);
copyButton.addEventListener('click', copyPassword);
resetButton.addEventListener('click', resetPreferences);

[uppercaseInput, lowercaseInput, numbersInput, symbolsInput].forEach((input) => {
    input.addEventListener('change', refreshPassword);
});

restoreState();
