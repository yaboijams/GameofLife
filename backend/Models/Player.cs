namespace GameOfLife.Models
{
public class Player
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public int Position { get; set; } = 0;
    public int Score { get; set; } = 0;
    public int Health { get; set; } = 100;
    public int Smarts { get; set; } = 100;
    public int Looks { get; set; } = 100;
    public int Happiness { get; set; } = 100;
    public bool IsAlive { get; set; } = true;
}



}
