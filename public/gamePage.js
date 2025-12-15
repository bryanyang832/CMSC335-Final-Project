window.onload = main;

function main() {
    document.getElementById("button1").addEventListener("click", button1);
    document.getElementById("button2").addEventListener("click", button2);
}

function button1() {
    submitAnswer("playerOne");
}

function button2() {
    submitAnswer("playerTwo");
}

async function submitAnswer(userChoice) {
    const res = await fetch("/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userChoice: userChoice })
    });

    const data = await res.json();

    if (data.correct) {
        alert(data.message);
        // location.reload();
        window.location.href = "/gamePage";
    } else {
        alert(data.message);
        window.location.href = "/leaderboard";
    }
}