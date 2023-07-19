import { nanoid } from "nanoid";
import './style.css';
import copy  from 'clipboard-copy';

const chave = document.querySelector('button');
const mostraSenha = document.querySelector('h2');

chave.addEventListener('click', () =>{
    const password = nanoid();
    mostraSenha.innerHTML = password
    
});

mostraSenha.addEventListener('click', (event) => {
    copy(event.target.innerHTML);
    alert('Senha copiada!');
});
