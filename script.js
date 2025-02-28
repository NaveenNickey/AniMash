// Initialize Supabase correctly
const { createClient } = window.supabase;
const supabaseUrl = "https://jvybcpcqekhddurjrgox.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2eWJjcGNxZWtoZGR1cmpyZ294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3MDc3MTksImV4cCI6MjA1NjI4MzcxOX0.wcQhrXc_A87bJ3l1lL70n4VoM6o0V-thpXmjfyesRQw";
const supabase = createClient(supabaseUrl, supabaseKey);

let actors = [];

// Fetch actors from Supabase
async function fetchActors() {
    const { data, error } = await supabase.from("actors").select("*");
    if (error) {
        console.error("Error fetching actors:", error);
        return;
    }
    actors = data;
    showRandomActors();
    fetchLeaderboard();
}

// Show two random actors for voting
function showRandomActors() {
    if (actors.length < 2) {
        console.error("Not enough actors in database.");
        return;
    }

    const [actor1, actor2] = getTwoRandomActors();
    document.getElementById("actor1").src = actor1.image_url;
    document.getElementById("actor1").dataset.id = actor1.id;
    document.getElementById("actor1-name").innerText = actor1.name;

    document.getElementById("actor2").src = actor2.image_url;
    document.getElementById("actor2").dataset.id = actor2.id;
    document.getElementById("actor2-name").innerText = actor2.name;
}

// Get two unique random actors
function getTwoRandomActors() {
    let shuffled = [...actors].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2);
}

// Vote for an actor
async function vote(selected) {
    const id = parseInt(document.getElementById(`actor${selected}`).dataset.id);

    console.log("Voting for actor ID:", id);

    const { error } = await supabase.rpc("increment_rating", {
        actor_id: id,
        value: 10
    });

    if (error) {
        console.error("Voting Error:", error);
        return;
    }

    console.log("Vote success, updating leaderboard...");

    await fetchLeaderboard();
    
    // ✅ Ensure new actors are shown after voting
    showRandomActors();
}

// Fetch and display the leaderboard
async function fetchLeaderboard() {
    console.log("Fetching leaderboard...");

    const { data, error } = await supabase
        .from("actors")
        .select("name, rating")
        .order("rating", { ascending: false });

    if (error) {
        console.error("Leaderboard Fetch Error:", error);
        return;
    }

    console.log("Leaderboard data:", data);

    const leaderboardEl = document.getElementById("leaderboard");
    leaderboardEl.innerHTML = data
        .map((actor, index) => `<p>${index + 1}. ${actor.name} - ${actor.rating} points</p>`)
        .join("");
}

// Visitor Counter Logic (Browser-Specific)
let totalVisits = localStorage.getItem('totalVisits');
if (!totalVisits) {
    totalVisits = 1;  // First time visitor
} else {
    totalVisits = parseInt(totalVisits) + 1;  // Increment for returning visitors
}
localStorage.setItem('totalVisits', totalVisits);
document.getElementById('totalVisitCount').textContent = totalVisits;

// Fetch and display comments
async function fetchComments() {
    const { data, error } = await supabase.from("user_comments").select("*").order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching comments:", error);
        return;
    }

    const commentsList = document.getElementById("comments-list");
    commentsList.innerHTML = data
        .map(comment => `<p><strong>${comment.created_at}</strong>: ${comment.text}</p>`)
        .join("");
}

// Handle comment form submission
document.getElementById("comment-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const commentText = document.getElementById("comment-text").value;
    if (!commentText.trim()) return;

    const { error } = await supabase.from("user_comments").insert([{ text: commentText }]);
    if (error) {
        console.error("Error submitting comment:", error);
        return;
    }

    // Clear the input and fetch the updated comments
    document.getElementById("comment-text").value = "";
    fetchComments();
});

// Run on page load
fetchActors();
fetchComments();
