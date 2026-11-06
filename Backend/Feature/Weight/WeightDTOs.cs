namespace Backend.Feature.Weight;

public record CreateMeasurement(string Name, double LengthCm);

public record UpsertWeightEntryForm(
    DateOnly Date,
    double WeightKg,
    string MeasurementsJson,
    IFormFileCollection? Photos
);
