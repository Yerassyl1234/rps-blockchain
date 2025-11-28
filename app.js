// DOM Elements
const connectBtn = document.getElementById("connectBtn");
const walletAddress = document.getElementById("walletAddress");
const result_p = document.querySelector(".result > p");
const userScore_span = document.getElementById("user-score");
const computerScore_span = document.getElementById("computer-score");

// Game Elements
const rock = document.getElementById("r");
const paper = document.getElementById("p");
const scissors = document.getElementById("s");

// Web3 Variables
let provider;
let signer;
let contract;

// 🟢 ЗАМЕНИ ЭТОТ АДРЕС НА ТВОЙ ИЗ REMIX (Part 1)
const contractAddress = "0xe02b21Cc49f824Ebd567d3B35c390A9Ebb2c2ECf";

// ABI включает Event GamePlayed, чтобы мы могли узнать результат
const contractABI = [
    {
		"inputs": [
			{
				"internalType": "uint8",
				"name": "userMove",
				"type": "uint8"
			}
		],
		"name": "play",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"stateMutability": "payable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint8",
				"name": "userMove",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "uint8",
				"name": "computerMove",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "uint8",
				"name": "result",
				"type": "uint8"
			}
		],
		"name": "GamePlayed",
		"type": "event"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	}
];

// 1. Connect Wallet Logic
async function connectWallet() {
    if (window.ethereum) {
        try {
            // Запрашиваем доступ к кошельку
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Инициализируем Ethers
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            contract = new ethers.Contract(contractAddress, contractABI, signer);
            
            const address = await signer.getAddress();
            
            // Обновляем UI
            walletAddress.innerText = `...${address.slice(-4)}`;
            connectBtn.innerText = "Connected";
            connectBtn.style.backgroundColor = "#4CAF50"; // Зеленый цвет
            result_p.innerText = "Make your move!";
            
            console.log("Connected to:", address);
        } catch (error) {
            console.error(error);
            alert("Connection failed!");
        }
    } else {
        alert("Please install MetaMask!");
    }
}

// 2. Main Game Logic
async function playMove(selection) {
    if (!contract) {
        alert("Please connect your wallet first!");
        return;
    }

    // Блокируем интерфейс, чтобы не кликали дважды
    result_p.innerText = "Confirm transaction in MetaMask...";
    
    try {
        // Отправляем транзакцию со ставкой 0.0001 ETH/BNB
        const tx = await contract.play(selection, { 
            value: ethers.utils.parseEther("0.0001") 
        });

        result_p.innerText = "Mining... please wait (5-10s)";

        // Ждем подтверждения блока
        const receipt = await tx.wait();

        // 🔍 Самое важное: ищем событие GamePlayed в логах транзакции
        const event = receipt.events.find(x => x.event === "GamePlayed");
        
        if (event) {
            // Достаем данные из события
            const { computerMove, result } = event.args;
            updateUI(selection, computerMove, result);
        } else {
            result_p.innerText = "Error: Event not found!";
        }

    } catch (error) {
        console.error(error);
        if(error.code === 4001) {
            result_p.innerText = "Transaction rejected by user.";
        } else {
            result_p.innerText = "Transaction failed!";
        }
    }
}

// 3. UI Helper Function
function updateUI(playerMove, computerMove, result) {
    const moves = ['Rock', 'Paper', 'Scissors'];
    const pMoveName = moves[playerMove];
    const cMoveName = moves[computerMove];

    // Result from Solidity: 0 = Draw, 1 = Win, 2 = Lose
    if (result === 1) { // WIN
        userScore_span.innerText = parseInt(userScore_span.innerText) + 1;
        result_p.innerText = `🔥 YOU WON! ${pMoveName} beats ${cMoveName}`;
        document.querySelector(".result").style.color = "#4CAF50";
    } else if (result === 2) { // LOSE
        computerScore_span.innerText = parseInt(computerScore_span.innerText) + 1;
        result_p.innerText = `💀 YOU LOST. ${cMoveName} beats ${pMoveName}`;
        document.querySelector(".result").style.color = "#E2584D";
    } else { // DRAW
        result_p.innerText = `⚖️ IT'S A DRAW! You both chose ${pMoveName}`;
        document.querySelector(".result").style.color = "white";
    }
}

// Event Listeners
connectBtn.addEventListener("click", connectWallet);

// 0 = Rock, 1 = Paper, 2 = Scissors
rock.addEventListener("click", () => playMove(0));
paper.addEventListener("click", () => playMove(1));
scissors.addEventListener("click", () => playMove(2));