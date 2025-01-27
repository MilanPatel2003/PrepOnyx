import Heading from "@/components/Heading";

const MathNotes = () => {
  return (
    <div className="space-y-6">
      <Heading
        title="AI Math Notes Converter"
        description="Transform your handwritten math notes into detailed digital solutions and explanations."
        showAddButton
        onAddClick={() => {
          // Handle add new math note
          console.log("Add new math note");
        }}
      />

      {/* Add your feature implementation here */}
    </div>
  );
};

export default MathNotes; 