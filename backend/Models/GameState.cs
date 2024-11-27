namespace GameOfLife.Models
{
 public class GameState
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public List<Player> Players { get; set; } = new List<Player>();
    public int TurnIndex { get; set; } = 0;
    public bool IsGameOver { get; set; } = false;
    public string LastEvent { get; set; } = string.Empty; // Ensure this is initialized
}


}
