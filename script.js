class Solitario {
    constructor() {
        this.palos = [
            { signo: '♥', color: 'rojo' }, { signo: '♦', color: 'rojo' },
            { signo: '♣', color: 'negro' }, { signo: '♠', color: 'negro' }
        ];
        this.valores = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        this.estado = {
            baraja: [], descarte: [],
            columnas: [[], [], [], [], [], [], []],
            pilasDestino: { '♥': [], '♦': [], '♣': [], '♠': [] },
            seleccion: null
        };
        
        // 🟢 NUEVO: Configurar botones del menú antes de arrancar nada
        this.configurarMenuInicial();
    }

    // 🟢 NUEVO: Controlar la pantalla de inicio
    configurarMenuInicial() {
        document.getElementById('boton-jugar').onclick = () => {
            // Ocultar menú de inicio y mostrar el tablero
            document.getElementById('pantalla-inicio').style.display = 'none';
            document.getElementById('tablero').style.display = 'block';
            
            // Arrancar el juego de verdad
            this.init();
        };

        // Configurar los botones del final para que funcionen desde ya
        document.getElementById('btn-reiniciar').onclick = () => this.reiniciarPartida();
        document.getElementById('btn-salir').onclick = () => this.salirAlMenu();
    }

    init() {
        // Asegurarse de limpiar el estado por si venimos de otra partida
        this.estado.descarte = [];
        this.estado.columnas = [[], [], [], [], [], [], []];
        this.estado.pilasDestino = { '♥': [], '♦': [], '♣': [], '♠': [] };
        this.estado.seleccion = null;

        this.crearBaraja();
        this.repartir();
        this.configurarEventos();
        this.render();
    }

    crearBaraja() {
        this.estado.baraja = [];
        this.palos.forEach(palo => {
            this.valores.forEach((valor, i) => {
                this.estado.baraja.push({ valor, numero: i + 1, ...palo, oculta: true });
            });
        });
        this.estado.baraja.sort(() => Math.random() - 0.5);
    }

    repartir() {
        for (let i = 0; i < 7; i++) {
            for (let j = i; j < 7; j++) {
                let carta = this.estado.baraja.pop();
                if (j === i) carta.oculta = false;
                this.estado.columnas[j].push(carta);
            }
        }
    }

    crearCartaElemento(carta, info) {
        const div = document.createElement('div');
        const sel = this.estado.seleccion;
        const esSeleccionada = sel && sel.tipo === info?.tipo && sel.colIndex === info?.colIndex && sel.cartaIndex === info?.cartaIndex;

        div.className = `carta ${carta.color} ${carta.oculta ? 'boca-abajo' : ''} ${esSeleccionada ? 'seleccionada' : ''}`;
        
        if (!carta.oculta) {
            div.innerHTML = `<div class="valor-superior">${carta.valor}${carta.signo}</div><div class="palo-central">${carta.signo}</div>`;
            if (info) {
                div.onclick = (e) => { e.stopPropagation(); this.seleccionarCarta(info.tipo, info.colIndex, info.cartaIndex); };
                div.ondblclick = (e) => { e.stopPropagation(); this.autoMover(carta, info); };
            }
        }

        if (info?.tipo === 'columna') {
            const gap = window.innerWidth < 600 ? 16 : 26;
            div.style.top = `${info.cartaIndex * gap}px`;
            div.style.zIndex = info.cartaIndex;
        }
        return div;
    }

    render() {
        // Mazo
        const mazoDiv = document.getElementById('mazo-origen');
        mazoDiv.className = `pila ${this.estado.baraja.length === 0 ? 'vacia' : 'boca-abajo'}`;
        mazoDiv.innerHTML = this.estado.baraja.length === 0 ? '↻' : '';

        // Descarte
        const descarteDiv = document.getElementById('descarte');
        descarteDiv.innerHTML = '';
        if (this.estado.descarte.length > 0) {
            descarteDiv.appendChild(this.crearCartaElemento(this.estado.descarte[this.estado.descarte.length-1], { tipo: 'descarte' }));
        }

        // Columnas
        this.estado.columnas.forEach((col, i) => {
            const el = document.getElementById(`col-${i}`);
            el.innerHTML = '';
            col.forEach((c, j) => el.appendChild(this.crearCartaElemento(c, { tipo: 'columna', colIndex: i, cartaIndex: j })));
            el.onclick = () => this.estado.seleccion && this.intentarMoverAColumna(i);
        });

        // Destinos
        this.palos.forEach(p => {
            const el = document.getElementById(`pila-${p.signo}`);
            const pila = this.estado.pilasDestino[p.signo];
            el.innerHTML = pila.length > 0 ? '' : p.signo;
            if (pila.length > 0) el.appendChild(this.crearCartaElemento(pila[pila.length-1], null));
            el.onclick = (e) => { e.stopPropagation(); this.intentarMoverADestino(p.signo); };
        });

        this.chequearVictoria();
    }

    seleccionarCarta(tipo, colIndex, cartaIndex) {
        if (this.estado.seleccion && tipo === 'columna') return this.intentarMoverAColumna(colIndex);
        this.estado.seleccion = { tipo, colIndex, cartaIndex };
        this.render();
    }

    robarCarta() {
        if (this.estado.baraja.length === 0) {
            this.estado.baraja = [...this.estado.descarte].reverse().map(c => ({...c, oculta: true}));
            this.estado.descarte = [];
        } else {
            const c = this.estado.baraja.pop();
            c.oculta = false;
            this.estado.descarte.push(c);
        }
        this.estado.seleccion = null;
        this.render();
    }

    intentarMoverAColumna(destIdx) {
        const sel = this.estado.seleccion;
        if (!sel) return;
        let cartas = sel.tipo === 'columna' ? this.estado.columnas[sel.colIndex].slice(sel.cartaIndex) : [this.estado.descarte[this.estado.descarte.length-1]];
        if (!cartas[0]) return;
        
        const colDest = this.estado.columnas[destIdx];
        const ultima = colDest[colDest.length-1];
        
        const esValido = (!ultima && cartas[0].valor === 'K') || (ultima && ultima.color !== cartas[0].color && ultima.numero === cartas[0].numero + 1);

        if (esValido) {
            if (sel.tipo === 'columna') {
                this.estado.columnas[sel.colIndex].splice(sel.cartaIndex);
                this.estado.columnas[destIdx].push(...cartas);
                this.revelarUltima(sel.colIndex);
            } else {
                this.estado.columnas[destIdx].push(this.estado.descarte.pop());
            }
        }
        this.estado.seleccion = null;
        this.render();
    }

    intentarMoverADestino(palo) {
        const sel = this.estado.seleccion;
        if (!sel) return;
        let carta = sel.tipo === 'columna' ? this.estado.columnas[sel.colIndex][sel.cartaIndex] : this.estado.descarte[this.estado.descarte.length-1];
        if (!carta || (sel.tipo === 'columna' && sel.cartaIndex !== this.estado.columnas[sel.colIndex].length - 1)) return;

        const pila = this.estado.pilasDestino[palo];
        const esValido = (pila.length === 0 && carta.valor === 'A' && carta.signo === palo) || (pila.length > 0 && carta.signo === palo && carta.numero === pila[pila.length-1].numero + 1);

        if (esValido) {
            pila.push(sel.tipo === 'columna' ? this.estado.columnas[sel.colIndex].pop() : this.estado.descarte.pop());
            if (sel.tipo === 'columna') this.revelarUltima(sel.colIndex);
        }
        this.estado.seleccion = null;
        this.render();
    }

    autoMover(carta, info) {
        for (const p of this.palos) {
            this.estado.seleccion = info;
            this.intentarMoverADestino(p.signo);
            if (!this.estado.seleccion) return;
        }
        this.estado.seleccion = null;
    }

    revelarUltima(idx) {
        const c = this.estado.columnas[idx];
        if (c && c.length > 0) c[c.length-1].oculta = false;
    }

    // 🛠️ MODIFICADO: En vez de recargar la página, activa tus botones al ganar
    chequearVictoria() {
        const total = Object.values(this.estado.pilasDestino).flat().length;
        if (total === 52) {
            setTimeout(() => { 
                alert("¡Victoria Magistral! 🏆"); 
                // Mostramos el div que contiene los botones de Reiniciar y Salir
                document.getElementById('controles-fin').style.display = 'block';
            }, 500);
        }
    }

    configurarEventos() {
        document.getElementById('mazo-origen').onclick = () => this.robarCarta();
    }

    // 🟢 NUEVA FUNCIÓN: Volver a jugar otra partida directamente
    reiniciarPartida() {
        document.getElementById('controles-fin').style.display = 'none';
        this.init();
    }

    // 🟢 NUEVA FUNCIÓN: Salir por completo al menú principal
    salirAlMenu() {
        document.getElementById('controles-fin').style.display = 'none';
        document.getElementById('tablero').style.display = 'none';
        document.getElementById('pantalla-inicio').style.display = 'flex';
    }
}

new Solitario();