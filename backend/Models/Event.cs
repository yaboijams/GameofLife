public class Event
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Description { get; set; }
    public int ScoreChange { get; set; }
    public string Type { get; set; } // e.g., "positive", "negative"
}
